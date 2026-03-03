import os

from dotenv import load_dotenv
from google.adk.agents.llm_agent import Agent
from .subagents import sub_agent

current_dir = os.path.dirname(os.path.abspath(__file__))

# Load instructions from sub_agent_instruction.md for the Nasi Lemak demo
md_path = os.path.join(current_dir, "subagents", "sub_agent_instruction.md")
if not os.path.exists(md_path):
    # Fallback to default if sub_agent_instruction.md doesn't exist
    md_path = os.path.join(current_dir, "agent_instruction.md")

with open(md_path, "r", encoding="utf-8") as f:
    root_agent_instructions = f.read()

load_dotenv()

MODEL_NAME = os.environ.get("GOOGLE_GENAI_MODEL", "gemini-2.5-flash")

root_agent = Agent(
    model=MODEL_NAME,
    name="root_agent",
    description="Customer Service Root Agent used to send to subagents based on the user input",
    instruction="Customer Service Root Agent used to send to subagents based on the user input",
    tools=[],
    sub_agents=[sub_agent],
)
