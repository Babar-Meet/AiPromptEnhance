from ollama import chat

def rewrite_prompt(raw_prompt: str) -> str:
    """
    Rewrite a messy human prompt into a polished, AI-agent-ready task prompt.
    It includes a strict role + single concise instruction.
    """
    instruction = (
        "You are a senior software developer and UI/UX expert. "
        "Rewrite the following text into a single concise, clear, and actionable developer task prompt. "
        "Correct all grammar and typos. "
        "Do NOT write letters, emails, paragraphs, lists, reasons, or explanations — "
        "only the exact developer task instruction. "
        "Preserve the user intention and do not add features that were not implied. "
        "The output must be immediately usable as an AI assistant task prompt:\n\n"
        f"{raw_prompt}"
    )

    response = chat(
        model="mistral:7b-instruct-v0.3-q8_0",
        messages=[{"role": "user", "content": instruction}]
    )

    # Extract output text reliably
    if hasattr(response, "message") and hasattr(response.message, "content"):
        text = response.message.content.strip()
    else:
        text = str(response).strip()

    # Ensure role context is included at top
    prefix = "You are a senior software developer and UI/UX expert. Task: "
    if text.lower().startswith(prefix.lower()):
        return text
    else:
        return prefix + text

def main():
    print("=== Prompt Generator AI === (type 'exit' to quit)")
    while True:
        user_input = input("\nYour prompt: ").strip()
        if user_input.lower() == "exit":
            print("bye")
            break

        try:
            rewritten = rewrite_prompt(user_input)
            print("\n--- Master Prompt ---\n")
            print(rewritten)
        except Exception as e:
            print("\nError rewriting prompt:", e)

if __name__ == "__main__":
    main()