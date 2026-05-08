from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app.agents.nodes import answer_node, prepare_prompt_node, retrieve_sources_node
from app.agents.state import AgentState


def build_agent_graph():
    graph = StateGraph(AgentState)

    graph.add_node("prepare_prompt", prepare_prompt_node)
    graph.add_node("retrieve_sources", retrieve_sources_node)
    graph.add_node("answer", answer_node)

    graph.add_edge(START, "prepare_prompt")
    graph.add_edge("prepare_prompt", "retrieve_sources")
    graph.add_edge("retrieve_sources", "answer")
    graph.add_edge("answer", END)

    return graph.compile()
