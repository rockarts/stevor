
import ollama, { ModelResponse } from 'ollama';
import { marked } from 'marked';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "stevor" is now active!');

	const disposable = vscode.commands.registerCommand('stevor.start', async () => {

		const panel = vscode.window.createWebviewPanel('deepchat', 'Deep Seek Chat',
			vscode.ViewColumn.One, { enableScripts: true });

		const listResponse = await ollama.list();
		const options: string[] = listResponse.models.map((option: ModelResponse) => (option.name));
		console.log(options);

		panel.webview.html = getWebviewContent(options);

		panel.webview.onDidReceiveMessage(async (message: any) => {
			console.log('Received message:', message);
			if (message.command === 'chat') {
				const userPrompt = message.text;
				const selectedModel = message.modelName;
				let responseText = 'Thinking...';

				panel.webview.postMessage({ command: 'chatThinking' });

				try {
					const streamResponse = await ollama.chat({
						model: selectedModel,
						messages: [{ role: 'user', content: userPrompt }],
						stream: false,
					});

					responseText = await marked.parse(streamResponse.message.content);
					panel.webview.postMessage({ command: 'chatResponse', text: responseText });

				} catch (error) {
					panel.webview.postMessage({ command: 'chatResponse', text: String(error) });
					console.error('Error in chat request:', error);
				}
			}
		});

	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(models: string[]) {
	var modelsSelect = `
        <label for="models" style="margin-right: 10px;">Installed Models:</label>
        <select id="models" name="models" style="margin-bottom: 10px;">
            ${models.map(model => `<option value="${model}">${model}</option>`).join("")}
        </select>`;

	const html = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Deep Seek Chat</title>
            <style>
                body {
                    font-family: sans-serif;
                    margin: 1rem;
                }
                #prompt { 
                    width: 100%; 
                    box-sizing: border-box; 
                }
                #response { 
                    border: 1px solid #ccc; 
                    margin-top: 1rem; 
                    padding: 0.5rem; 
                    min-height: 100px; 
                    white-space: pre-wrap; /* Preserve formatting */
                }
            </style>
            <!-- Include highlight.js -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
        </head>
        <body>
            <h2>Deep Seek Extensions</h2>
            <div style="margin-bottom: 10px;">${modelsSelect}</div>
            <textarea id="prompt" rows="4" placeholder="Enter your prompt..."></textarea><br />
            <button id="askBtn">Send</button>
            <div id="response"></div>
            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('askBtn').addEventListener('click', () => {
                    const text = document.getElementById('prompt').value;
                    const selectedModel = document.getElementById('models').value;

                    vscode.postMessage({ 
                        command: 'chat', 
                        text: text, 
                        modelName: selectedModel
                    });
                });

				window.addEventListener('message', (event) => {
					const { command, text } = event.data;
					const responseElement = document.getElementById('response');

					if (command === 'chatThinking') {
						responseElement.innerHTML = "<em>Thinking...</em>";
					}

					if (command === 'chatResponse') {
						if (responseElement) {
							responseElement.innerHTML = text;

							// Apply syntax highlighting
							document.querySelectorAll('pre code').forEach((block) => {
								hljs.highlightElement(block);
							});
						}
					}
				});
            </script>
        </body>
    </html>`;

	return html;
}
// This method is called when your extension is deactivated
export function deactivate() { }