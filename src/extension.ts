// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import ollama from 'ollama';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "stevor" is now active!');

	const disposable = vscode.commands.registerCommand('stevor.start', () => {
		const panel = vscode.window.createWebviewPanel('deepchat', 'Deep Seek Chat',
			vscode.ViewColumn.One, { enableScripts: true });

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			console.log('Received message:', message);
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let responseText = 'Thinking...';

				try {
					// const streamResponse = await ollama.chat({
					// 	//model: 'codellama:latest',
					// 	//model: 'deepseek-r1:latest',
					// 	model: 'llama3.2:latest',
					// 	messages: [{ role: 'user', content: userPrompt }],
					// 	stream: true,
					// });

					// chat(request: ChatRequest & {
					// 	stream?: false;
					// }): Promise<ChatResponse>;

					const streamResponse = await ollama.chat({
						//model: 'codellama:latest',
						//model: 'deepseek-r1:latest',
						model: 'llama3.2:latest',
						messages: [{ role: 'user', content: userPrompt }],
						stream: false,
					});

					responseText = streamResponse.message.content;
					panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					// for await (const chunk of streamResponse) {
					// 	responseText += chunk.message.content;
					// 	panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					// }


				} catch (error) {
					panel.webview.postMessage({ command: 'chatResponse', text: String(error) });
					console.error('Error in chat request:', error);
					responseText = 'An error occurred while processing your request.';
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return `
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
                }
            </style>
		</head>
		<body>
			<h2>Deep Seek Extensions</h2>
			<textarea id="prompt" rows="4" placeholder="Enter your prompt..."></textarea><br />
			<button id="askBtn">Send</button>
			<div id="response"></div>
			<script>
				const vscode = acquireVsCodeApi();
				console.log('vscode:', vscode);
				document.getElementById('askBtn').addEventListener('click', () => {
					const text = document.getElementById('prompt').value;
					vscode.postMessage({ command: 'chat', text });
				});

                window.addEventListener('message', (event) => {
						const {command, text} = event.data;
						if (command === 'chatResponse') {
							const responseElement = document.getElementById('response');
							if (responseElement) {
								responseElement.innerHTML = text;
							}
						}
					});
			</script>
			
		</body>
		</html>
	`;
}
// This method is called when your extension is deactivated
export function deactivate() { }