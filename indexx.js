import * as dotenv from "dotenv"
dotenv.config()
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
//import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Create docs with a loader
const loader = new PDFLoader('./Atomic-habits.pdf');
const docs = await loader.load();
//console.log(docs)


// Split the text into chunks
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
const chunkedDocs = splitter.splitDocuments(docs);


// Load the docs into the vector store
const vectorStore = await FaissStore.fromDocuments(
  chunkedDocs,
  new OpenAIEmbeddings()
);

// Search for the most similar document
//const result = await vectorStore.similaritySearch("what accident did the author have?", 1);
//console.log(result);

// Initialize the model
const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY, 
});

// Create a RetrievalQAChain
const chain = new RetrievalQAChain({
  retriever: vectorStore.asRetriever(), // Convert vector store to retriever
  llm: model, // Use the model for the language task
});

// Use the chain to answer a question
const question = "What accident did the author have?";
const response = await chain.call({ query: question });

console.log(response);