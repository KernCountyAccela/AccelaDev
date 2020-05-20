var SCRIPT_VERSION = 3.0;
var useCustomScriptFile = true;
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useCustomScriptFile));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useCustomScriptFile));
eval(getScriptText("INCLUDES_CUSTOM",null,useCustomScriptFile));
showDebug = true;
showMessage= true;
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
aa.print("----------------------------------------------------------------------------------------------------------------------");
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
    // lookup the plan review tasks for this workflow task
    aa.print("Task '"+taskItem.getTaskDescription()+"'. Process="+taskItem.getProcessID()+" Step="+taskItem.getStepNumber());
    aa.print("----------------------------------------------------------------------------------------------------------------------");
  var reviewTasks = reviewTasksBiz.getDocumentReviewTasks(recordId, taskItem.getProcessID(), taskItem.getStepNumber());
  if(reviewTasks == null)
    continue;
    var iter = reviewTasks.iterator();
  var hasApprovedTask = false;
    var hasRejectedTask = false;
    var hasActiveTask = false;
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
        logDebug("Checking "+reviewTask.getTaskName()+" status "+revStatus+" "+taskItem.getTaskItem().getAssignedStatus()+" dispo "+taskItem.getDisposition());
        aa.print("Checking document "+reviewTask.getTaskName()+". Current Status = '"+revStatus+"'. "+taskItem.getTaskItem().getAssignedStatus()+" dispo "+taskItem.getDisposition());
        if(revStatus == "Approved"){
            hasApprovedTask = true;
        }
        else if(revStatus == "Corrections Needed"){
            hasRejectedTask = true;
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
        if(hasApprovedTask && !hasRejectedTask)
        {
            logDebug("Setting Workflow Task Status to Approved");
        uTaskItem.setDisposition("Approved");
        uTaskItem.setSysUser(revUser);
        uTaskItem.setStatusDate(aa.util.now());
        aa.workflow.handleDisposition(uTaskItem, recordId);
     //sendTaskEventToVelosimo("UpdatedWorkflowTask", recordId, taskItem.getTaskDescription(), model.getEntityID3(), taskItem.getDisposition());
        }
        else if(hasRejectedTask)
        {
            logDebug("Setting Workflow Task Status to Corrections Needed");
        uTaskItem.setDisposition("Corrections Needed");
        uTaskItem.setSysUser(revUser);
		uTaskItem.setStatusDate(aa.util.now());
        aa.workflow.handleDisposition(uTaskItem, recordId);
//sendTaskEventToVelosimo("UpdatedWorkflowTask", recordId, taskItem.getTaskDescription(), model.getEntityID3(), taskItem.getDisposition());
        }
    }
}
if (debug.indexOf("**ERROR") > 0)
    {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
    }
else
    {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug)  aa.env.setValue("ScriptReturnMessage", debug);
    }
/*
function logDebug(msg) {
   aa.print(msg);
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
function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode)  servProvCode = aa.getServiceProviderCode();
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        if (useProductScripts) {
            var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
        } else {
            var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
        }
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}
function arrayParse(arry)
{
    for(x in arry)
    if(x != null)
    {
        aa.print(x + ' | ' + arry[x])
    }
}