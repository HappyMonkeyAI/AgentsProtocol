import os
import re
import logging
import requests
from pathlib import Path
from dotenv import load_dotenv
from neo4j import GraphDatabase

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load .env files
load_dotenv() # Load local .env first
VAULT_ENV = Path("/home/stephen/Documents/www/LLM-Codex-Reference-Vault/.env")
if VAULT_ENV.exists():
    load_dotenv(VAULT_ENV) # Fallback to vault .env if variables not set

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text:latest")

MEMORIES_FILE = Path(__file__).resolve().parent.parent / ".agent" / "memories" / "patterns_and_lessons.md"
PROJECT_NAME = "Agents Protocol"

class MemorySync:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def get_embedding(self, text: str) -> list[float]:
        try:
            response = requests.post(
                f"{OLLAMA_HOST}/api/embed",
                json={
                    "model": OLLAMA_MODEL, 
                    "input": text[:8000],
                    "truncate": True,
                    "options": {"num_ctx": 8192}
                },
                timeout=15
            )
            response.raise_for_status()
            embs = response.json().get("embeddings", [])
            return embs[0] if embs else []
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return []

    def parse_memories(self, content):
        memories = []
        # Match ## [Type] Header with Title
        # - **Date:** ...
        # - **Pattern:** ...
        # - **Lesson:** ...
        # Updated regex to handle the specific format in patterns_and_lessons.md
        pattern = r'## \[(?P<type>.*?)\] (?P<title>.*?)\n- \*\*Date:\*\* (?P<date>.*?)\n- \*\*Pattern:\*\* (?P<pattern>.*?)\n- \*\*Lesson:\*\* (?P<lesson>.*?)(?=\n##|\Z)'
        matches = re.finditer(pattern, content, re.DOTALL)
        
        for match in matches:
            memories.append(match.groupdict())
        return memories

    def sync(self):
        if not MEMORIES_FILE.exists():
            logger.error(f"Memories file not found: {MEMORIES_FILE}")
            return

        content = MEMORIES_FILE.read_text()
        memories = self.parse_memories(content)
        
        if not memories:
            logger.info("No memories found to sync or parse failed.")
            return

        logger.info(f"Found {len(memories)} memories. Checking for updates...")

        with self.driver.session() as session:
            # Ensure Project node exists
            session.run("MERGE (p:Project {name: $name})", name=PROJECT_NAME)

            for mem in memories:
                # Create a unique ID for the memory based on project, date, and type
                clean_title = re.sub(r'\W+', '_', mem['title']).lower()
                mem_id = f"mem_{PROJECT_NAME.lower().replace(' ', '_')}_{mem['date']}_{clean_title}"
                
                # Check if memory already exists to avoid redundant embedding calls
                result = session.run("MATCH (m:Memory {id: $mem_id}) RETURN m.id", mem_id=mem_id)
                if result.peek():
                    logger.info(f"Memory already synced: {mem['title']}")
                    continue

                content_blob = f"{mem['pattern']}\n\n{mem['lesson']}"
                embedding = self.get_embedding(content_blob)

                session.run("""
                    MATCH (p:Project {name: $project_name})
                    MERGE (m:Memory {id: $mem_id})
                    SET m.type = $type,
                        m.title = $title,
                        m.date = $date,
                        m.pattern = $pattern,
                        m.lesson = $lesson,
                        m.content = $content,
                        m.embedding = $embedding
                    MERGE (m)-[:BELONGS_TO]->(p)
                """, project_name=PROJECT_NAME, mem_id=mem_id, 
                   type=mem['type'], title=mem['title'], date=mem['date'],
                   pattern=mem['pattern'], lesson=mem['lesson'],
                   content=content_blob, embedding=embedding)
                
                logger.info(f"Synced memory: {mem['title']}")

if __name__ == "__main__":
    # Suggestion: Run in background to avoid blocking the main thread
    # Example: python3 sync_memories.py &
    syncer = MemorySync(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    try:
        syncer.sync()
    finally:
        syncer.close()
