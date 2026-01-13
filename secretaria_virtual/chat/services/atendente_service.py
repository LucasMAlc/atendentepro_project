import asyncio
from pathlib import Path
from atendentepro import activate, create_standard_network
from agents import Runner

activate()

network = create_standard_network(
    templates_root=Path("atendente_templates"),
    client="config",
    include_knowledge=False,
)

async def process_message(message: str) -> str:
    result = await Runner.run(
        network.triage,
        [{"role": "user", "content": message}]
    )
    return result.final_output
