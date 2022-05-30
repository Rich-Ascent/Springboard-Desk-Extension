var deskAPI = "";
var crmAPI = "";
if(location.hostname == "127.0.0.1")
{
	deskAPI = "https://desk.zoho.eu/api/v1";
	crmAPI = "https://zohoapis.eu/crm/v2";
}
else
{
	deskAPI = "https://desk.zoho.com/api/v1";
	crmAPI = "https://zohoapis.com/crm/v2";
}
function extMain (){
	ZOHODESK.extension.onload().then(function (App) {
		ZOHODESK.get('ticket.id').then(function (response) {
			getTicketAccount(response["ticket.id"]);
		}).catch(function (error) {
			console.log(error);
		});
	});
}

function getTicketAccount(p_TicketId)
{
	request = {
		url: deskAPI + "/tickets/" + p_TicketId,
		headers: {'Content-Type' : 'application/json'},
		type : 'GET',
		data: {'':''},
		postBody : {},
		connectionLinkName : 'sbde_zoho_desk'
	}
	ZOHODESK.request(request).then(function(response) {
		getCRMAccount(JSON.parse(JSON.parse(response)["response"])["statusMessage"]["accountId"]);
	}).catch(function(error) {
		console.log(error);
	});
}

function getCRMAccount(p_AccountId)
{
	request = {
		url: deskAPI + "/accounts/" + p_AccountId,
		headers: {'Content-Type' : 'application/json'},
		type : 'GET',
		data: {'':''},
		postBody : {},
		connectionLinkName : 'sbde_zoho_desk'
	}
	ZOHODESK.request(request).then(function(response) {
		// console.log(response)
		getCRMParentAccount(JSON.parse(JSON.parse(response)["response"])["statusMessage"]["zohoCRMAccount"]["id"]);
	}).catch(function(error) {
		console.log(error);
	});
}

function getCRMParentAccount(p_CRMAccountId)
{
	request = {
		url: crmAPI + "/Accounts/" + p_CRMAccountId,
		headers: {'Content-Type' : 'application/json'},
		type : 'GET',
		data: {'':''},
		postBody : {},
		connectionLinkName : 'sbde_zoho_crm'
	}
	ZOHODESK.request(request).then(function(response) {
		document.getElementById("parent_account_name").innerHTML = JSON.parse(JSON.parse(response)["response"])["statusMessage"]["data"][0]["Parent_Account"]["name"];
		getCRMParentContacts(JSON.parse(JSON.parse(response)["response"])["statusMessage"]["data"][0]["Parent_Account"]["id"]);
	}).catch(function(error) {
		console.log(error);
	});
}

function getCRMParentContacts(p_CRMParentAccountId)
{
	request = {
		url: crmAPI + "/Accounts/" + p_CRMParentAccountId + "/Contacts",
		headers: {'Content-Type' : 'application/json'},
		type : 'GET',
		data: {'':''},
		postBody : {},
		connectionLinkName : 'sbde_zoho_crm'
	}
	ZOHODESK.request(request).then(function(response) {
		let contactListHTML = "";
		JSON.parse(JSON.parse(response)["response"])["statusMessage"]["data"].forEach(function (item,index){
			contactListHTML = contactListHTML + "<tr><td colspan=\"2\">&nbsp</td></tr>";
			let contactHTML = "";
			contactHTML = contactHTML + "<tr><td class=\"label\">" + item["Full_Name"] + "</td><td class=\"status\">";
			if (item["Contact_Active_Status"])
			{
				contactHTML = contactHTML + " (" + item["Contact_Active_Status"] + ")";
			}
			contactHTML = contactHTML + "</td></tr>";
			if (item["Title"])
			{
				contactHTML = contactHTML + "<tr><td colspan=\"2\">" + item["Title"] + "</td></tr>";
			}
			if (item["Contact_Description"] && item["Contact_Description"].length > 0)
			{
				contactHTML = contactHTML + "<tr><td colspan=\"2\">";
				item["Contact_Description"].forEach(function (item,index,array) {
					if(index > 0 & index + 1 < array.length)
					{
						contactHTML = contactHTML + ", ";
					}
					else if(index > 0 && index + 1 === array.length)
					{
						contactHTML = contactHTML + " &amp; ";
					}
					contactHTML = contactHTML + item;
				});
				contactHTML = contactHTML + "</td></tr>";
			}
			contactHTML = contactHTML + "<tr><td colspan=\"2\">" + item["Email"] + "</td></tr>";
			contactHTML = contactHTML + "<tr><td colspan=\"2\"><a href=\"javascript:addEmail(\'" + item["Email"] + "\',\'to\')\">To</a>&nbsp<a href=\"javascript:addEmail(\'" + item["Email"] + "\',\'cc\')\">Cc</a>&nbsp<a href=\"javascript:addEmail(\'" + item["Email"] + "\',\'bcc\')\">Bcc</a></td></tr>";
			contactListHTML = contactListHTML + contactHTML;
		});
		document.getElementById("contact_list").innerHTML = contactListHTML;
	}).catch(function(error) {
		console.log(error);
	});
}

function addEmail(p_EmailAddress,p_Type)
{
	ZOHODESK.get('ticket.replyEditorRecipients').then(function(response) {
		if(response["ticket.replyEditorRecipients"])
		{
			l_CurrentEmails = response["ticket.replyEditorRecipients"][p_Type].split(",");
			const l_NewEmails = []
			v_Exists = false;
			l_CurrentEmails.forEach(function (item,index){
				if(item.length > 0){
					l_NewEmails.push(item);
				}
				if(item == p_EmailAddress){
					v_Exists = true;
				}
			});
			if(!v_Exists){
				l_NewEmails.push(p_EmailAddress);
				ZOHODESK.set('ticket.replyEditorRecipients',{[p_Type]:[l_NewEmails]}).then(function (response) {
				}).catch(function (error) {
					console.log(error);
				});
			}
		}
   	}).catch(function(error){
		console.log(error);
   	});
}