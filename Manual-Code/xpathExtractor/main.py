from github.copilot.sdk import CopilotClient, AgentMessage

client = CopilotClient()  # Configure via env if needed, e.g., COPILOT_API_KEY
msg = AgentMessage(role="user", content="Hello from SDK")
# Example: send a simple message (adjust to your SDK version’s method names)
resp = client.chat.complete(messages=[msg])
print(resp)