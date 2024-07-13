import { PromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers"
import dotenv from 'dotenv';
dotenv.config()
const model = new ChatOpenAI({
    temperature: 0.5, 
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY
}).bind({
    response_format: {
      type: "json_object",
    }})

const taskTemplate = `
The following are the classifications of tasks:

GQ - This means general question, where the query is just a general question about task management
WQ - This means website question, where the query is about website features, or how to navigate the website
CTQ - This means create task query, where the query has instructed the model to create a query, and provided its details 
UTQ - This means update task query, where the query has instructed the model to update an already existing query with new details
DTQ - This means delete task query, where the query has instructed the model to delete an already existing query
MQ - This means mixed query, where the query has multiple of the same or different query types (GQ, WQ, CTQ, UTQ, DTQ)
`

const promptTemplate = PromptTemplate.fromTemplate(
    `
    system
    You are a model designed to classify the type of tasks to run from and input query. \\n

    {TASK_TYPES} \\n\\n

    Given the user's query, determing the query type. \\n\\n

    Return a JSON object that contains two keys: 'question' and 'q_type'. \\n 
    
    'question' field contains the query corrected and simplified. \\n

    'q_type' field contains the query type determined. \\n

    Refer to the following examples\\n

    User: Hey assistant, schedule a meeting for me at 9:00 pm today \\n
    Result: 
    {{"question":"schedule meeting for 9:00pm today",
      "q_type":"CTQ"}} \\n

    User: I missed my meeting yesterday. Kindly delete that task for me\\n
    Result:
    {{"question":"delete missed meeting yesterday",
      "q_type":"DTQ"}} \\n

    User: How do I create a task?\\n
    Result: 
    {{"question":"Find out how to create task",
      "q_type":"WQ"}} \\n

    User: Is it a good idea to create a task for late night or early morning?\\n
    Result: 
    {{"question":"Better option: create task for late night or early morning",
      "q_type":"GQ"}} \\n
    
    User: Hi. Kindly schedule a meeting for me at 10:00 am tomorrow and move the meeting I have tonight from 8:00pm to 9:00pm\\n
    Result: 
    {{"question":"Schedule a meeting at 10:00 amd tomorrow, and modify meeting time for today from 8:00pm to 9:00 pm",
      "q_type":"MQ"}} \\n
    
    User: I want to watch a basketball game 8 hours from now. I want to have gonn shopping 2 hours before then \\n  
    Result:  
    {{'question': 'Schedule to watch basketball in 8 hours and schedule shopping 2 hours before the basketball game',
      'q_type': 'MQ'}} \\n \\n
    
    user
    Question: {query} \\n
    assistant
        `
      );

const taskDeterminationChain = promptTemplate.pipe(model).pipe(new JsonOutputParser())

export const determineTaskType = async (state) => {
    console.log("Determining the task type!")
    const result = await taskDeterminationChain.invoke(
        {
            "query": state.query, 
            "TASK_TYPES": taskTemplate,
        }
        )
      state.ref_query = result.question
      state.q_type = result.q_type
    if (result.q_type === "MQ"){
        state.multiple = true
        }
    return state
}