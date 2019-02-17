import * as vscode from 'vscode';
import * as avro from 'avsc';
const path = require('path');

export function activate({ subscriptions }: vscode.ExtensionContext) {

	const myScheme = 'avro';

	async function decode(path: string) {
		let metadata = '';
		let datas: Array<string> = [];
		const decoder = avro.createFileDecoder(path);
		decoder.on("metadata", (type: any) => {
			metadata = JSON.stringify(type, null, 4);
		});
		decoder.on("data", (type: any) => {
			datas.push(JSON.stringify(type, null, 4));
		});
		await new Promise(resolve => decoder.on('end', () => resolve("ended")));
		const data = datas.join("\n");
		return `=============METADATA============
${metadata}

===============DATA==============
${data}
`;
	}

	const myProvider = new class implements vscode.TextDocumentContentProvider {	
		async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
			return await decode(uri.query);
		}
	};
	subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

	// register a command that opens a avro-document
	subscriptions.push(vscode.commands.registerCommand('avro.preview', async () => {
		if (!vscode.window.activeTextEditor) {
			return;
		}
		const avroUri = vscode.window.activeTextEditor.document.uri;
		if (path.extname(avroUri.path) !== '.avro') {
			return;
		}
		const title = `Preview ${avroUri.path}`;
		const viewerUri = vscode.Uri.parse(`avro:${title}?${avroUri.path}`);
		let doc = await vscode.workspace.openTextDocument(viewerUri); // calls back into the provider
		await vscode.window.showTextDocument(doc, { preview: false });
	}));
}

export function deactivate() {}
