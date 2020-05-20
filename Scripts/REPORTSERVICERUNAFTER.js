var SCRIPT_VERSION = "2.0";
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

showDebug = true;
//showMessage = true;
	
function getScriptText(vScriptName){
                vScriptName = vScriptName.toUpperCase();
                var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
                var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
                return emseScript.getScriptText() + "";
}
var id = aa.env.getValue("reportId");
comment(id);
comment("this is a test");
if(id==13){

var report = aa.reportManager.getReportModelByName("JobCard_Add").getOutput();

var url= aa.reportManager.runReport(aa.util.newHashMap(), report).getOutput();
openUrlInNewWindow(url);
var output = "</d"+"iv> \r\n <s"+"cript language='JavaScript' type='text/JavaScript'>\r\n<!--\r\n window.open('https://aadev.rmant.rma.co.kern.ca.us"+url+"'); \r\n//-->\r\n </s"+"cript>\r\n <d"+"iv>\r\n";
aa.print(output);  
//aa.logMessage(output);

comment(output)
}