/* eslint-disable no-console */
import { LightningElement, api,track, wire} from 'lwc';
import retrieve from '@salesforce/apex/GetProcessInstanceData.retrieve';
import process from '@salesforce/apex/GetProcessInstanceData.process';
import getFieldDescribes from '@salesforce/apex/GetProcessInstanceData.getFieldDescribes';

const actions = [
    { label: 'Approve', name: 'Approve' },
    { label: 'Reject', name: 'Reject' },
    { label: 'Reassign', name: 'Removed' }
];




export default class ItemsToApproveTable extends LightningElement {

    @api rowData;
    @api columns;
    @api actorId;
    @api mode='single';
    @api contextObjectType;
    @api fieldNames; //field names provided by called to be rendered as columns
    @track rowData;
    error;
    //DONE convert apex class to get called from here. 
    //restructure flow

    //mode is mixed or singleObject
    //if mixed, treat as already implemented
    //else single object
        //pass up the field name list
        //pass up contextobjecttype ("Account")
    //fieldnames is a csv corresponding to the context object type name



    //both createcolumn and create rowdata call for extra items
    //split the csv. for each field, add a column
    //in the row data, extract the field value from the record



  /*   get columns() {
        if (this.mode === 'Standard') {
            return this.createCustomColumns();
        }
            
        else if (this.mode === 'Mixed') {
                return this.createStandardColumns();
                
            }
                
            else throw new Error('Invalid or missing value provided for the "mode" input');
                
    }

    @wire(getFieldDescribes, { objectName: '$contextObjectType', fieldNames : '$fieldNames'}) 
    columns;
     */
     set contextObjectType(value) {
         console.log ('setting contextObjectType to: ' + value);
         //getFields();
         this.contextObjectType = value;
     }

     getFields() {
        console.log('entering getFields');
        if ((this.contextObjectType) && (this.fieldNames)) {
			console.log('data available to call getFieldDescribes');
            const foo = getFieldDescribes({ objectName: '$contextObjectType', fieldNames : '$fieldNames'})
            .then(result => {
                console.log('getFieldDescribes returns: ' + result);
                this.columns = JSON.parse(result);
                console.log('columns set to ' + JSON.parse(result));
                })
                .catch(error => {
                    console.log('error is: ' + JSON.stringify(error));
                    this.error = error;
                    return this.error;
                });
            }
        else {
            console.log('data not available to call getFieldDescribes');

            }

     }

     connectedCallback () {
       this.retrieveWorkItems();
       const fieldDescribes = getFieldDescribes({ objectName: '$contextObjectType', fieldNames : '$fieldNames'})
        .then(result => {
            console.log('getFieldDescribes returns: ' + result);
            this.columns = JSON.parse(result);
            console.log('columns set to ' + JSON.parse(result));
            })
            .catch(error => {
                console.log('error is: ' + JSON.stringify(error));
                this.error = error;
                return this.error;
            });

       console.log('entering ItemstoApprove LWC');

    }

    retrieveWorkItems () {
        console.log('retrieving process work items for user: ' + this.actorId);
        retrieve({ actorId: this.actorId})
            .then(result => {
                console.log('result is: ' + result);
                this.rowData = this.createRowData(result);
            })
            .catch(error => {
                console.log('error is: ' + error);
                this.error = error;
                return this.error;
            });
    }
    //receive event from child datatable
    handleRowAction(event){
        console.log('entering handleRowAction in itemsToApproveTable.js');
        const action = event.detail.action;
        let row = event.detail.row;
        console.log('action is: ' + JSON.stringify(action));
        console.log('row.ActorId is:' + row.ActorId);
        console.log('action.name is: ' + action.name);
        console.log('workitemid is: ' + row.WorkItemId);
        const workItemIds = [];
        workItemIds.push(row.WorkItemId);
        const processResult = process({ actorId: row.ActorId, action : action.name, workItemIds : workItemIds})
        .then(result => {
            console.log('result from process call is: ' + result);
            this.retrieveWorkItems();
            this.showToast('Approval Management', action.name + ' Complete', 'success', true);
  
        })
        .catch(error => {
            console.log('error returning from process work item apex call is: ' + error);  
        });  
    }

    showToast(title, message, variant, autoClose) {
        this.template.querySelector('c-toast-message').showCustomNotice({
            detail: {
                title: title, message: message, variant: variant, autoClose: autoClose
            }
        });
    }

    createStandardColumns() {
        var columnDescriptor = '{"label": "Submitter", "fieldName": "Submitter", "type": "text"}';
        columnDescriptor = columnDescriptor + ',{"label": "Type", "fieldName": "Type", "type": "text"}';
        columnDescriptor = columnDescriptor + ',{"label": "Record Name", "fieldName": "RecordURL", "type": "url", "typeAttributes": { "label": { "fieldName": "RecordName"}, "target": "_blank" }  }';
        columnDescriptor = columnDescriptor + ',{"type": "action", "typeAttributes": { "rowActions" : ' + JSON.stringify(actions) + ', "menuAlignment" : "left" }}'
        columnDescriptor = '[' + columnDescriptor + ']';
        console.log('total standard columnDescriptor is:  ' + columnDescriptor);
        return JSON.parse(columnDescriptor);
    }

    createCustomColumns() {
        var columnDescriptor = '{"label": "Submitter", "fieldName": "Submitter", "type": "text"}';
        columnDescriptor = columnDescriptor + ',{"label": "Record Name", "fieldName": "RecordURL", "type": "url", "typeAttributes": { "label": { "fieldName": "RecordName"}, "target": "_blank" }  }';
        
        columnDescriptor = columnDescriptor + ',{"type": "action", "typeAttributes": { "rowActions" : ' + JSON.stringify(actions) + ', "menuAlignment" : "left" }}'
        columnDescriptor = '[' + columnDescriptor ;
        const customColumns = getFieldDescribes({ objectName: this.contextObjectType, fieldNames : this.fieldNames})
        .then(result => {
            console.log('result from getFieldDescribes call is: ' + result);
            columnDescriptor = columnDescriptor + result + ']';
            console.log('total custom columnDescriptor is:  ' + columnDescriptor);
            const temp = '[{"label": "Submitter", "fieldName": "Submitter", "type": "text"},' +
           '{"label": "Type", "fieldName": "Type", "type": "text"},' +
            '{"label": "Record Name", "fieldName": "RecordURL", "type": "url", "typeAttributes": { "label": { "fieldName": "RecordName"}, "target": "_blank" }  },{"type": "action", "typeAttributes": { "rowActions" : [{"label":"Approve","name":"Approve"},' +
            '{"label":"Reject","name":"Reject"},{"label":"Reassign","name":"Removed"}], "menuAlignment" : "left" }}]';
            this.columns = JSON.parse(temp);
            //this.columns = JSON.parse(columnDescriptor);
        })
        .catch(error => {
            console.log('error returning from getFieldDescribes apex call is: ' + error);  
        }); 
        //given an object and a field name, find the type and label and return a valid string structure
       
    }

    createRowData(workItemData) {
        var outputData = '';
        var inputData = JSON.parse(workItemData);
        console.log('input data is: ' + workItemData);
        inputData.forEach(element => {
           
            outputData = outputData + '{"Submitter" : "' + element.createdByName +'", "WorkItemId" : "' + element.workItemId + '", "ActorId" : "' + element.actorId + '", "TargetObjectId" : "' +  element.targetObjectId + '", "Type" : "' + element.contextRecordObjectType + '", "RecordName" : "' + element.contextRecordName + '", "RecordURL" : "' + element.contextRecordURL + '"},';
        });
        outputData = '[' +  outputData.slice(0,-1) + ']';
        console.log('outputData is: ' + outputData);
        return JSON.parse(outputData);
    }


}