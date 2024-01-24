var { Eta } = require('eta');
var HTMLParser = require('node-html-parser');
var HTMLPrettify = require('pretty');
var fs = require('fs');

const core = require('@actions/core');
const github = require('@actions/github');

try {
	
	const jsonDataFilePath = core.getInput('json-data-file-path');
	const htmlFileWithTemplate = core.getInput('html-file-with-template');
	const queryToTemplateElement = core.getInput('query-to-template-element');
	const queryToOutputElement = core.getInput('query-to-output-element');

	var jsonData = fs.readFileSync( jsonDataFilePath , 'utf-8')
			.split('\n');

	// remove first and last line (used for client-side only)
	jsonData.shift();
	jsonData.pop();


	const data = JSON.parse( jsonData.join('') );
	// get template
	const templateFile = fs.readFileSync( htmlFileWithTemplate , 'utf-8');
	const htmlRoot = HTMLParser.parse( templateFile );
	const template = htmlRoot.querySelector( queryToTemplateElement )?.innerHTML ?? "";

	// remove unnecessary sections (marked with data-no-render attribute)
	htmlRoot.querySelectorAll('[data-no-render]').forEach(el => el.remove());

	// run template engine
	const eta = new Eta({ escapeFunction: (str) => str }); // disable XML-escaping (aka don't turn ' to &#39;)
	const result = eta.renderString(template, data);
	htmlRoot.querySelector( queryToOutputElement ).set_content( result );

	// prettify HTML string
	const fullHtml = htmlRoot.toString();
	const prettifiedFullHtml = HTMLPrettify( fullHtml, { ocd: true } );

	// final output
	core.setOutput( "html-output", prettifiedFullHtml );
	
} catch (error) {
	core.setFailed(error.message);
}