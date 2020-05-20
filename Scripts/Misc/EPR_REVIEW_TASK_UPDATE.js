eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
//eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
 //===========================================================================================
var debug = "";
var showDebug = 3;

var model = aa.env.getValue("DocumentReviewModel");
logDebug("documentReviewModel = " + model);
logDebug("ID: " + model.getResID());
logDebug("Status: " + model.getStatus());
logDebug("Document ID: " + model.getDocumentID());
logDebug("Entity Type: " + model.getEntityType());
logDebug("Entity ID: " + model.getEntityID());
logDebug("User ID: " + model.getEntityID1());
logDebug("Process ID: " + model.getEntityID2());
logDebug("Step Number: " + model.getEntityID3());
logDebug("Assign Pages: " + model.getTaskReviewPages());
logDebug("Assign Comments: " + model.getTaskReviewComments());

logDebug("id1: " + model.getID1());
logDebug("id2: " + model.getID2());
logDebug("id3: " + model.getID3());

aa.print("documentReviewModel = " + model);
aa.print("ID: " + model.getResID());
aa.print("Status: " + model.getStatus());
aa.print("Document ID: " + model.getDocumentID());
aa.print("Entity Type: " + model.getEntityType());
aa.print("Entity ID: " + model.getEntityID());
aa.print("User ID: " + model.getEntityID1());
aa.print("Process ID: " + model.getEntityID2());
aa.print("Step Number: " + model.getEntityID3());
aa.print("Assign Pages: " + model.getTaskReviewPages());
aa.print("Assign Comments: " + model.getTaskReviewComments());

aa.print("id1: " + model.getID1());
aa.print("id2: " + model.getID2());
aa.print("id3: " + model.getID3());

var recordId = aa.cap.getCapID(model.getID1(), model.getID2(), model.getID3(), "", 0).getOutput();
var wfObj = aa.workflow.getTasks(recordId).getOutput();
var ejbProxy = aa.proxyInvoker.newInstance("com.accela.aa.util.EJBProxy").getOutput();
var reviewTasksBiz = ejbProxy.getDocumentEntityAssociationService();

for (i in wfObj)
{
	taskItem = wfObj[i];
  
 	var sameStep = (model.getEntityID3().intValue() == taskItem.getStepNumber());
 	logDebug("Model: "+model.getEntityID3().intValue()+" Task: "+taskItem.getStepNumber());
 	if(!sameStep)
 	{
 		continue;
 	}

	aa.print("Workflow Task "+taskItem.getTaskDescription()+" Status="+taskItem.getDisposition()+" Process="+taskItem.getProcessID()+" Step="+taskItem.getStepNumber());

	if(taskItem.getTaskDescription() == "Plans Coordination" && (taskItem.getDisposition() != "In Review" && taskItem.getDisposition() != ""))
	{
		logDebug("Plans Coordination Review Task is already statused with |"+taskItem.getDisposition()+"|..skipping check");
		aa.print("Plans Coordination Review Task is already statused with |"+taskItem.getDisposition()+"|..skipping check");
		continue;
	}	
	
 	// lookup the plan review tasks for this workflow task
  var reviewTasks = reviewTasksBiz.getDocumentReviewTasks(recordId, taskItem.getProcessID(), taskItem.getStepNumber());

  if(reviewTasks == null)
  	continue; 

	var iter = reviewTasks.iterator();
  var hasApprovedTask = false;
	var hasRejectedTask = false;
	var hasActiveTask = false;
	var hasCanceledTask = false;
  var total = 0;
	while(iter.hasNext())
	{
    reviewTask = iter.next();
	 
		revStatus = reviewTask.getStatus().split(","); 
		revUser = null;
		if(revStatus.length == 2)
		{
			revUser = aa.people.getSysUserByID(revStatus[1]).getOutput();
			revStatus = revStatus[0];
		}	

		logDebug("Checking document"+reviewTask.getTaskName()+" status "+revStatus+" "+taskItem.getTaskItem().getAssignedStatus()+" dispo "+taskItem.getDisposition());
	 	aa.print("Checking document "+reviewTask.getTaskName()+". Current Status = '"+revStatus+"'. "+" dispo "+taskItem.getDisposition());

		if(revStatus == "Approved"){
			hasApprovedTask = true;
		}
		else if(revStatus == "Corrections Needed"){
			hasRejectedTask = true;
		}
		else if(revStatus == "Not Applicable"){
			hasCanceledTask = true;
		}
		else
		{
			hasActiveTask = true;
		}
    total++;
	}

	aa.print("hasActiveSubtasks: "+hasActiveTask);
	aa.print("hasRejectedSubtasks: "+hasRejectedTask);
	aa.print("hasApprovedSubtasks: "+hasApprovedTask);

  // no active tasks so check the statuses
	if(!hasActiveTask)
	{
 		var uTaskItem = taskItem.getTaskItem();
		if(hasApprovedTask && !hasRejectedTask) // has all approved subtasks
		{
			logDebug("Setting Workflow Task Status to Approved");
			aa.print("Setting Workflow Task Status to Approved");
    	uTaskItem.setDisposition("Approved");
			uTaskItem.setSysUser(revUser);						
    	aa.workflow.handleDisposition(uTaskItem, recordId);
		aa.print("Sending event to Velosimo");
				sendTaskEventToVelosimo("UpdatedWorkflowTask", recordId, uTaskItem.getTaskDescription(), uTaskItem.getStepNumber(), uTaskItem.getDisposition());
		}
		else if(hasRejectedTask) // has all rejected subtasks
		{
			logDebug("Setting Workflow Task Status to Corrections Needed");
			aa.print("Setting Workflow Task Status to Corrections Needed");
	 		uTaskItem.setDisposition("Corrections Needed");
			uTaskItem.setSysUser(revUser);						
 			aa.workflow.handleDisposition(uTaskItem, recordId);
			aa.print("Sending event to Velosimo "+recordId+" "+uTaskItem.getTaskDescription()+" "+uTaskItem.getStepNumber()+" "+uTaskItem.getDisposition());
				sendTaskEventToVelosimo("UpdatedWorkflowTask", recordId,  uTaskItem.getTaskDescription(), uTaskItem.getStepNumber(), uTaskItem.getDisposition());
		
		}	
		else if(hasCanceledTask) // has all canceled subtasks
		{
			logDebug("Setting Workflow Task Status to Not Applicable");
			aa.print("Setting Workflow Task Status to Not Applicable");
	 		uTaskItem.setDisposition("Not Applicable");
  		aa.workflow.handleDisposition(uTaskItem, recordId);
		}	
	}
}

/*
aa.env.setValue("ScriptReturnCode", "0");
//if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);

function logDebug(dstr) {
	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1];
	if ((showDebug & vLevel) == vLevel || vLevel == 1)
		debug += dstr + "<br>";
	if ((showDebug & vLevel) == vLevel)
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr);
}
*/

function matches(eVal, argList) {
	for (var i = 1; i < arguments.length; i++) {
		if (arguments[i] == eVal) {
			return true;
		}
	}
	return false;
}

