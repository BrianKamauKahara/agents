import * as dotenv from "dotenv"
dotenv.config()
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createRetrievalChain } from "langchain/chains/retrieval";


const pinecone = new Pinecone();
console.log(process.env.PINECONE_INDEX)
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);


// Create docs with a loader
const loader = new PDFLoader('./Atomic-habits.pdf');
const docs = await loader.load();
//console.log(docs)

await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings({ modelName: 'text-embedding-ada-002' }), {
  pineconeIndex,
  maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
});


// Create a RetrievalQAChain
const embeddings = new OpenAIEmbeddings({ modelName: 'text-embedding-ada-002' });
const vectorStore = new PineconeStore(pineconeIndex, embeddings);
const retrievalQAChain = new createRetrievalChain({
  retriever: vectorStore.asRetriever(),
  openai: new OpenAI({
    model: 'gpt-3.5-turbo', 
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

const question = "What accident did the author have?";
const response = await chain.call({ query: question });

console.log(response);