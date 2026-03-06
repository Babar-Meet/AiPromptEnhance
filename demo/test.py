from ollama import chat

def rewrite_prompt(raw_prompt: str) -> str:
    # instruction for rewriting
    instruction = (
        "Rewrite this prompt to be clear, professional, concise, and well‑formatted:\n\n"
        f"{raw_prompt}"
    )

    # send to model
    response = chat(
        model="mistral:7b-instruct-v0.3-q8_0",
        messages=[{"role": "user", "content": instruction}]
    )

    # response may be a list of chunks — join them
    text = ""
    if isinstance(response, list):
        for msg in response:
            # each item might have a "content"
            if "content" in msg:
                text += msg["content"]
    else:
        # safe fallback
        text = str(response)

    return text.strip()

def main():
    print("=== Prompt Rewriter === (type exit to quit)")
    while True:
        user_input = input("\nYour prompt: ").strip()
        if user_input.lower() == "exit":
            print("bye")
            break

        try:
            rewritten = rewrite_prompt(user_input)
            print("\n--- Rewritten Prompt ---\n")
            print(rewritten)
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    main()