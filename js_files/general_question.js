import { PromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers"
import dotenv from 'dotenv';
dotenv.config()

const promptTemplate = PromptTemplate.fromTemplate(
    `
    system
    Give a general answer to a question.Be brief, so as to reduce expenses. Have a friendly tone\\n
    
    Here is the current date incase it is relevant: Current time [DAY,DATE,TIME] {date}. The date is in year-month-day format, and time in 24h system.
    user
    Question: {query} \\n
    assistant
    `
  );

const model = new ChatOpenAI({
    temperature: 0.5,
    apiKey: process.env.OPENAI_API_KEY, 
    model: "gpt-3.5-turbo"
})

const generalQuestionChain = promptTemplate.pipe(model).pipe(new StringOutputParser())

export const generateGeneralAnswer = async (state) => {
    if (state.multiple){
        state.task_output.splice(state.num_tasks - 1, 1);
    }
    console.log("Currently answering a general question!")
    const result = await generalQuestionChain.invoke(
        {
            "query": state.ref_query, 
            "date":state.date
        }
        )
    state.task_output = [{"GQ":result},...state.task_output.filter(x => x !== null)]
    return state
}

