import { PromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers"
import dotenv from 'dotenv';
dotenv.config()

const taskTemplate =  `
The following are the classifications of tasks:

GQ - This means general question, where the query is just a general question about task management
WQ - This means website question, where the query is about website features, or how to navigate the website
CTQ - This means create task query, where the query has instructed the model to create a query, and provided its details 
UTQ - This means update task query, where the query has instructed the model to update an already existing query with new details
DTQ - This means delete task query, where the query has instructed the model to delete an already existing query

`

const promptTemplate = PromptTemplate.fromTemplate(
    `
    system
    You are a model designed to identify the types of tasks in a given query\\n

    {iTASK_TYPES} \\n\\n

    Given the query, break it down to task and task type. \\n\\n

    Return a JSON object that contains an arbitrary number of keys, Depending on how many tasks you could extract.\\n 

    Each key should be a task type, and the value should be a list of tasks that belong to that task type\\n

    Refer to the following examples to learn how data should be structured. The values for keys should be made wrapped into a list\\n \\n

    User: Meeting for 9:00am postponed to 1:00pm. Baby shower to attend tomorrow\\n
    Result: 
    {{"UTQ":["Meeting for 9:00am postponed to 1:00pm"],
      "CTQ":["Baby shower to attend tomorrow"]}} \\n

    User: Change title from Date with Abigael to date with Abigail. Then, reschedule cooking classes from 9:00am tomorrow to 1:00pm tomorrow\\n
    Result: 
    {{"UTQ":["Change title from Date with Abigael to date with Abigail",
            "reschedule cooking classes from 9:00am tomorrow to 1:00pm tomorrow"]}} \\n

    User: Read Bible at 9:00am, Take shower at 10:00am, Leave for work at 11:00am. Postpone meeting time to 2:00pm\\n
    Result: 
    {{"CTQ":["Read Bible at 9:00am",
            "Take shower at 10:00am",
            "Leave for work at 11:00am."],
      "UTQ":["Postpone meeting time to 2:00pm"]}} \\n

    User: No longer have a date with Abby on Wednesday, 2:00pm. Schedule movies on that day at 3:00pm.\\n
    Result: 
    {{"DTQ":["No longer have a date with Abby on Wednesday"],
      "CTQ":["Schedule movies on Wednesday at 3:00pm."]}} \\n

    User: No longer have meeting today at 8:00pm. I have a class at 10:00pm.\\n
    Result: 
    {{"DTQ": ["No longer have meeting today at 8:00pm"],
      "CTQ": ["I have a class today at 10:00pm"]}} \\n \\n

    Do take note that the same date or can be mentioned for two different tasks.If and only if this is so, then, when giving a response, make sure each task's detail has the time and/or date \\n
    Refer to the following examples to know how the object should be structured. Look at the following example:\\n
    
    User: Today I have a LOT of work. I have to prepare food for the kids by 8am, and still be at work by 10 pm. Then, I should submit work documents by 4:00pm. Thank God the meeting at 3:00pm was postponed to tomorrow!
    Result:
    {{"CTQ":["prepare food for the kids by 8 am today",
            "be at work by 10 pm today",
            "submit the work documents by 4:00pm today"],
      "UTQ": ["the meeting at 3:00pm today was postponed to tomorrow"]}} \\n
    Notice that today has been repeated four times. \\n \\n

    user
    Question: {query} \\n
    assistant
    `
  );

const model = new ChatOpenAI({
    temperature: 0.5,
    apiKey: process.env.OPENAI_API_KEY, 
    model: "gpt-3.5-turbo"
}).bind({
    response_format: {
      type: "json_object",
    }})

const queryBreakdownChain = promptTemplate.pipe(model).pipe(new JsonOutputParser())

const handleMQ = async (mqDetail) => {
    let returnList = [];
    Object.keys(mqDetail).forEach(key => {
        mqDetail[key].forEach(item => {
            returnList.push({ [key]: item });
        });
    })
    return returnList};

export const mixedQueryHandler = async (state) => {
    console.log("Currently Handling a Mixed Query!!")
    const result_imp = await queryBreakdownChain.invoke(
        {
            "query": state.ref_query, 
            "iTASK_TYPES": taskTemplate,
            "date":state.date
        }
        )
    const result = await handleMQ(result_imp)
    result.push({'DONE':'NECESSARY STOP SEQUENCE'})
 
    state.task_output = result 
    return state
}

