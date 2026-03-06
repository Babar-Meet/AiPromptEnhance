import re
from ollama import chat

def rewrite_prompt(raw_prompt: str) -> str:
    """
    Rewrite messy human prompt into a polished, multi-line, numbered AI-agent-ready master prompt.
    """
    instruction = (
        "You are a senior software developer and UI/UX expert. "
        "Rewrite the following user input into a clear, actionable, multi-line, numbered developer task list. "
        "Correct grammar, typos, and vague wording automatically. "
        "Do NOT write letters, emails, or paragraphs. Only output numbered task instructions. "
        "Preserve user intent without inventing new features.\n\n"
        f"{raw_prompt}"
    )

    try:
        response = chat(
            model="mistral:7b-instruct-v0.3-q8_0",
            messages=[{"role": "user", "content": instruction}]
        )

        if hasattr(response, "message") and hasattr(response.message, "content"):
            text = response.message.content.strip()
        else:
            text = str(response).strip()

        # Ensure role is prepended
        prefix = "You are a senior software developer and UI/UX expert. Task:\n"
        if not text.lower().startswith(prefix.lower()):
            text = prefix + text

        # Clean up extra spaces
        text = re.sub(r'\s+\n', '\n', text)
        text = re.sub(r'\n+', '\n', text).strip()
        return text

    except Exception as e:
        return f"Error rewriting prompt: {e}"

def batch_process(input_file: str, output_file: str):
    """
    Reads multiple prompts from a text file and outputs rewritten multi-line prompts to another file.
    Each line in the input file is treated as a separate prompt.
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            prompts = f.readlines()

        rewritten_prompts = []
        for prompt in prompts:
            prompt = prompt.strip()
            if prompt:
                # Split messy combined prompts automatically
                chunks = re.split(r'\b(uhh|ok so|also|and)\b', prompt, flags=re.IGNORECASE)
                for chunk in chunks:
                    chunk = chunk.strip()
                    if chunk:
                        rewritten = rewrite_prompt(chunk)
                        rewritten_prompts.append(rewritten)

        with open(output_file, 'w', encoding='utf-8') as f:
            for rp in rewritten_prompts:
                f.write(rp + '\n\n')  # extra line for readability

        print(f"Batch processing complete! Rewritten prompts saved to {output_file}")
    except Exception as e:
        print(f"Error in batch processing: {e}")

def interactive_mode():
    print("=== Master Prompt Generator (Multi-line) ===")
    print("(type 'exit' to quit, or 'batch input.txt output.txt' for batch processing)")

    while True:
        user_input = input("\nYour prompt: ").strip()
        if user_input.lower() == "exit":
            print("bye")
            break
        elif user_input.lower().startswith("batch"):
            parts = user_input.split()
            if len(parts) == 3:
                batch_process(parts[1], parts[2])
            else:
                print("Usage: batch inputfile.txt outputfile.txt")
            continue
        else:
            # Split messy combined prompts automatically
            chunks = re.split(r'\b(uhh|ok so|also|and)\b', user_input, flags=re.IGNORECASE)
            for chunk in chunks:
                chunk = chunk.strip()
                if chunk:
                    rewritten = rewrite_prompt(chunk)
                    print("\n--- Master Prompt ---\n")
                    print(rewritten)

if __name__ == "__main__":
    interactive_mode()