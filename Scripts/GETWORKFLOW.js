var paramRecId = aa.env.getValue("recordId");

aa.env.setValue("recordId", paramRecId);
var recordId = aa.cap.getCapID(paramRecId).getOutput();
var wfObj = aa.workflow.getTasks(recordId).getOutput();
var ejbProxy = aa.proxyInvoker.newInstance("com.accela.aa.util.EJBProxy").getOutput();
var reviewTasksBiz = ejbProxy.getDocumentEntityAssociationService();
var resTaskItems = [];
for (i in wfObj)
{
    taskItem = wfObj[i];
   // lookup the plan review tasks for this workflow task
//aa.print("Task "+taskItem.getTaskDescription()+" P="+taskItem.getProcessID()+" S="+taskItem.getStepNumber());
   var reviewTasks = reviewTasksBiz.getDocumentReviewTasks(recordId, taskItem.getProcessID(), taskItem.getStepNumber());

//aa.print("Review Tasks "+reviewTasks);   

if(reviewTasks == null)
       continue; 

//aa.print("Review Tasks Size "+reviewTasks.size());  

    var iter = reviewTasks.iterator();
    while(iter.hasNext())
    {
       reviewTask = iter.next();

       resReviewTask = {}
       resReviewTask.docName = new String(reviewTask.getTaskName());
       resReviewTask.docId = new String(reviewTask.getDocumentModel().getId().getDocSeqNbr());
       resReviewTask.docTaskId = new String(reviewTask.getResID());
       resReviewTask.description = new String(taskItem.getTaskDescription());
       if(taskItem.getAssignmentDate() != null)
      {
         resReviewTask.assignedDate = new String(formatDate(taskItem.getAssignmentDate()));
      }
    if(taskItem.getDueDate() != null)
    {
      resReviewTask.dueDate = new String(formatDate(taskItem.getDueDate()));
    }
    if(taskItem.getStatusDate() != null)
    {
      resReviewTask.statusDate = new String(taskItem.getStatusDate());
    }
    resReviewTask.isActive = new String(taskItem.getActiveFlag());
    resReviewTask.isCompleted = new String(taskItem.getCompleteFlag());
    resReviewTask.assignedToUser = new String(taskItem.getAssignedStaff());
    resReviewTask.stepNumber = new String(taskItem.getStepNumber());
    resReviewTask.processId = new String(taskItem.getProcessID());

      if(reviewTask.getAssigner() != null)
         resReviewTask.docTaskAssignedToUser = new String(reviewTask.getAssigner());
       if(reviewTask.getAssignedDepartment())
         resReviewTask.docTaskAssignedToDepartment = new String(reviewTask.getAssignedDepartment()); 
      resTaskItems.push(resReviewTask);
   }
}
aa.env.setValue("workflow", JSON.stringify(resTaskItems));
aa.print(JSON.stringify(resTaskItems));

function formatDate(inputDate)
{
   var fDate = inputDate.getMonth()+"/"+
      inputDate.getDayOfMonth()+"/"+
     inputDate.getYear()+" "+
     inputDate.getHourOfDay()+":"+
     inputDate.getMinute()+":"+
     inputDate.getSecond();

  return fDate;
}