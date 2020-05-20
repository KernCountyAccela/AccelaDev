var refDocId = aa.env.getValue("refDocId");

var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
var ds = initialContext.lookup("java:/AA");
var conn = ds.getConnection();
var rs = null;

var selectString = "select doc_seq_nbr, b1_per_id1, b1_per_id2, b1_per_id3 from bdocument b, xentity_3rdparty xp "+
 "where xp.entity_id_3rd = '"+refDocId+"' "+
  "and xp.entity_type = 'DOCUMENT' "+
  "and xp.third_party_code = 'EPC' "+
  "and b.doc_seq_nbr = xp.entity_id ";

var stmt = conn.prepareStatement(selectString);
rs = stmt.executeQuery();
if (rs)
{
 	rs.next();
        aa.env.setValue("docId", rs.getString("doc_seq_nbr"));
        var recordId = aa.cap.getCapID(rs.getString("b1_per_id1"), rs.getString("b1_per_id2"), rs.getString("b1_per_id3")).getOutput();
        aa.env.setValue("customId", recordId.getCustomID());
        aa.env.setValue("recordId", rs.getString("b1_per_id1")+"-"+rs.getString("b1_per_id2")+"-"+rs.getString("b1_per_id3"));

}

if (rs != null) { rs.close(); }
if (stmt != null) { stmt.close(); }
if (conn != null) { conn.close(); }