/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Hyperldger Cookbook
 * Author: Brian Wu
 */

'use strict';
/**
 * Write your transction processor functions here
 */

 /**
  * Initial the farmatrace application
  * @param {org.packt.farmatrace.InitialApplication} initalAppliation - the InitialApplication transaction
  * @transaction
  */
 async function initialApplication(application) {
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     const drugReceipt = factory.newResource(namespace, 'DrugReceipt', application.receiptId);
     drugReceipt.currentStatus = 'START';
     drugReceipt.evidents = [];
   
     //initial drug 
     const drug = factory.newResource(namespace, 'Drug', application.drugId);
     drug.manu_date="1900-01-01";
     drug.expire_date="1900-01-01";
     drug.name=application.drug_name;
     drug.desc=application.drug_desc;
     drugReceipt.drug = drug;

     //save the application
     const drugRegistry = await getAssetRegistry(drug.getFullyQualifiedType());
     await drugRegistry.add(drug);
     //save the application
     const receiptRegistry = await getAssetRegistry(drugReceipt.getFullyQualifiedType());
     await receiptRegistry.add(drugReceipt);
  
     // emit event
     const applicationEvent = factory.newEvent(namespace, 'InitialApplicationEvent');
     applicationEvent.drugReceipt = drugReceipt;
     emit(applicationEvent);
 }
 /**
  * Manufacturer make a drug
  * @param {org.packt.farmatrace.makeDrug} makeDrug - Manufacturer make a drug
  * @transaction
  */
 async function makeDrug(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'START') {
         throw new Error ('This drug receipt should be in START');
     }
     drugReceipt.currentStatus = 'CREATE_DRUG';
     let fromResults = await query('findManufacturerById',
          {
       			"manufacturerId": request.fromId
			});
     if(fromResults.length==0) {
          throw new Error ('Cant find manufacturer');
     }
/**    const nativeSupport = request.nativeSupport;
    const nativeFromIdKey = getNativeAPI().createCompositeKey('Participant:org.packt.farmatrace.Manufacturer', [request.fromId]);
    const fromIterator = await getNativeAPI().getHistoryForKey(nativeFromIdKey);
    let fromResults = [];
    let fromRes = {done : false};
    while (!fromRes.done) {
        fromRes = await fromIterator.next();
        if (fromRes && fromRes.value && fromRes.value.value) {
            let val = fromRes.value.value.toString('utf8');
            if (val.length > 0) {
                fromResults.push(JSON.parse(val));
            }
        }
        if (fromRes && fromRes.done) {
            try {
                fromIterator.close();
            }
            catch (err) {
            }
        }
    }
     if(fromResults.length==0) {
          throw new Error ('Cant find manufacturer');
     }
    **/
   	 let evidentId =  Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'MANUAFACTURER';
     evident.to = 'MANUAFACTURER';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
     evident.status ='CREATE_DRUG'
     //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);
     let drug = drugReceipt.drug;
     var currentDate = new Date()
     var day = currentDate.getDate()
     var month = currentDate.getMonth() + 1
     var year = currentDate.getFullYear();
   
     drug.manu_date = year + "-" + month + "-" + day;
     drug.expire_date = (year + 3) + "-" + month + "-" + day;
     const drugAssetRegistry = await getAssetRegistry(drug.getFullyQualifiedType());
     await drugAssetRegistry.update(drug);
     const drugReceiptAssetRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptAssetRegistry.update(drugReceipt);

     // emit event
     const makeDrugEvent = factory.newEvent(namespace, 'makeDrugEvent');
     makeDrugEvent.drugReceipt = drugReceipt;
     emit(makeDrugEvent);
 }
 /**
  * Manufacturer send drug To Distribute
  * @param {org.packt.farmatrace.sendToDistribute} sendToDistribute - Manufacturer send drug To Distribute
  * @transaction
  */
 async function sendToDistribute(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'CREATE_DRUG') {
         throw new Error ('This drug receipt should be in CREATE_DRUG');
     }
     drugReceipt.currentStatus = 'PICK_UP_DRUG';
     let fromResults = await query('findManufacturerById',
          {
       			"manufacturerId": request.fromId
		});
     if(fromResults.length==0) {
          throw new Error ('Cant find manufacturer');
     }
     let toResults = await query('findDistributionById',
          {
       			"distributionId": request.toId
		});
     if(toResults.length==0) {
          throw new Error ('Cant find Distribution');
     }

     //save the application
   	 let evidentId = Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'MANUAFACTURER';
     evident.to = 'DISTRIBUTION';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
   
     evident.status ='PICK_UP_DRUG'
      //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);

     const drugReceiptRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptRegistry.update(drugReceipt);

     // emit event
     const sendToDistributeEvent = factory.newEvent(namespace, 'sendToDistributeEvent');
     sendToDistributeEvent.drugReceipt = drugReceipt;
     emit(sendToDistributeEvent);
 }
 /**
  * Distribute send drug To Physician
  * @param {org.packt.farmatrace.distributeToPhysician} distributeToPhysician -  Distribute send drug To Physician
  * @transaction
  */
 async function distributeToPhysician(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'PICK_UP_DRUG') {
         throw new Error ('This drug receipt should be in PICK_UP_DRUG');
     }
     drugReceipt.currentStatus = 'DEVLIER_PHYSICIAN';
     let fromResults = await query('findDistributionById',
          {
       			"distributionId": request.fromId
		});
     if(fromResults.length==0) {
          throw new Error ('Cant find Distribution');
     }
     let toResults = await query('findPhysicianById',
          {
       			"physicianId": request.toId
		});
     if(toResults.length==0) {
          throw new Error ('Cant find Physician');
     }
     //save the application
   	 let evidentId = Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'DISTRIBUTION';
     evident.to = 'PHYSICIAN';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
   
     evident.status ='DEVLIER_PHYSICIAN'
      //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);

     const drugReceiptRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptRegistry.update(drugReceipt);

     // emit event
     const distributeEvent = factory.newEvent(namespace, 'distributeEvent');
     distributeEvent.drugReceipt = drugReceipt;
     emit(distributeEvent);
 }
 /**
  * Distribute send drug To Pharmacy
  * @param {org.packt.farmatrace.distributeToPharmacy} distributeToPharmacy - Distribute send drug To Pharmacy
  * @transaction
  */
 async function distributeToPharmacy(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'PICK_UP_DRUG') {
         throw new Error ('This drug receipt should be in PICK_UP_DRUG');
     }
     drugReceipt.currentStatus = 'DEVLIER_PHARMACY';
     let fromResults = await query('findDistributionById',
          {
       			"distributionId": request.fromId
		});
     if(fromResults.length==0) {
          throw new Error ('Cant find Distribution');
     }
     let toResults = await query('findPharmacyById',
          {
       			"pharmacyId": request.toId
		});
     if(toResults.length==0) {
          throw new Error ('Cant find Pharmacy');
     }
     //save the application
   	 let evidentId = Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'DISTRIBUTION';
     evident.to = 'PHARMACY';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
   
     evident.status ='DEVLIER_PHARMACY'
      //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);

     const drugReceiptRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptRegistry.update(drugReceipt);

     // emit event
     const distributeEvent = factory.newEvent(namespace, 'distributeEvent');
     distributeEvent.drugReceipt = drugReceipt;
     emit(distributeEvent);
 }
 /**
  * Distribute send drug To Hospital
  * @param {org.packt.farmatrace.distributeToHospital} distributeToHospital - Distribute send drug To Hospital
  * @transaction
  */
 async function distributeToHospital(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'PICK_UP_DRUG') {
         throw new Error ('This drug receipt should be in PICK_UP_DRUG');
     }
     drugReceipt.currentStatus = 'DEVLIER_HOSPITAL';
     let fromResults = await query('findDistributionById',
          {
       			"distributionId": request.fromId
		});
     if(fromResults.length==0) {
          throw new Error ('Cant find Distribution');
     }
     let toResults = await query('findHospitalById',
          {
       			"hospitalId": request.toId
		});
     if(toResults.length==0) {
          throw new Error ('Cant find Hospital');
     }
     //save the application
   	 let evidentId = Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'DISTRIBUTION';
     evident.to = 'HOSPITAL';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
   
     evident.status ='DEVLIER_HOSPITAL'
      //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);

     const drugReceiptRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptRegistry.update(drugReceipt);

     // emit event
     const distributeEvent = factory.newEvent(namespace, 'distributeEvent');
     distributeEvent.drugReceipt = drugReceipt;
     emit(distributeEvent);
 }
 /**
  * Customer buy drug from  Pharmacy
  * @param {org.packt.farmatrace.buyFromPharmacy} buyFromPharmacy - Customer buy drug from  Pharmacy
  * @transaction
  */
 async function buyFromPharmacy(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'DEVLIER_PHARMACY') {
         throw new Error ('This drug receipt should be in DEVLIER_PHARMACY');
     }
     drugReceipt.currentStatus = 'CUSTOMER_RECEIVED';
     let fromResults = await query('findPharmacyById',
          {
       			"pharmacyId": request.fromId
		});
     if(fromResults.length==0) {
          throw new Error ('Cant find Pharmacy');
     }
     let toResults = await query('findCustomerById',
          {
       			"customerId": request.toId
		});
     if(toResults.length==0) {
          throw new Error ('Cant find Customer');
     }
     //save the application
   	 let evidentId = Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'PHARMACY';
     evident.to = 'CUSTOMER';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
   
     evident.status ='CUSTOMER_RECEIVED'
      //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);

     const drugReceiptRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptRegistry.update(drugReceipt);

     // emit event
     const buyEvent = factory.newEvent(namespace, 'buyEvent');
     buyEvent.drugReceipt = drugReceipt;
     emit(buyEvent);
 }
 /**
  * Customer buy drug from  Hospital
  * @param {org.packt.farmatrace.buyFromHospital} buyFromHospital - Customer buy drug from  Hospital
  * @transaction
  */
 async function buyFromHospital(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'DEVLIER_HOSPITAL') {
         throw new Error ('This drug receipt should be in DEVLIER_HOSPITAL');
     }
     drugReceipt.currentStatus = 'CUSTOMER_RECEIVED';
     let fromResults = await query('findHospitalById',
          {
       			"hospitalId": request.fromId
		});
     if(fromResults.length==0) {
          throw new Error ('Cant find Hospital');
     }
     let toResults = await query('findCustomerById',
          {
       			"customerId": request.toId
		});
     if(toResults.length==0) {
          throw new Error ('Cant find Customer');
     }
     //save the application
   	 let evidentId = Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'HOSPITAL';
     evident.to = 'CUSTOMER';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
   
     evident.status ='CUSTOMER_RECEIVED'
      //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);

     const drugReceiptRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptRegistry.update(drugReceipt);

     // emit event
     const buyEvent = factory.newEvent(namespace, 'buyEvent');
     buyEvent.drugReceipt = drugReceipt;
     emit(buyEvent);
 }
 /**
  * Customer buy drug from  Physician
  * @param {org.packt.farmatrace.buyFromPhysician} buyFromPhysician - Customer buy drug from  Physician
  * @transaction
  */
 async function buyFromPhysician(request) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';
     let drugReceipt = request.drugReceipt;
     if (drugReceipt.currentStatus != 'DEVLIER_PHYSICIAN') {
         throw new Error ('This drug receipt should be in DEVLIER_PHYSICIAN');
     }
     drugReceipt.currentStatus = 'CUSTOMER_RECEIVED';
     let fromResults = await query('findPhysicianById',
          {
       			"physicianId": request.fromId
		});
     if(fromResults.length==0) {
          throw new Error ('Cant find Physician');
     }
     let toResults = await query('findCustomerById',
          {
       			"customerId": request.toId
		});
     if(toResults.length==0) {
          throw new Error ('Cant find Customer');
     }
     //save the application
   	 let evidentId = Math.random().toString(36).replace('0.', '');
     let evident = factory.newResource(namespace, 'Evident', evidentId);
     evident.lastUpdate = new Date();
     evident.from = 'PHYSICIAN';
     evident.to = 'CUSTOMER';
     evident.fromId = request.fromId;
     evident.toId = request.toId;
   
     evident.status ='CUSTOMER_RECEIVED'
      //save the application
     const evidentRegistry = await getAssetRegistry(namespace+ '.Evident');
     await evidentRegistry.add(evident);
     drugReceipt.evidents.push(evident);

     const drugReceiptRegistry = await getAssetRegistry(request.drugReceipt.getFullyQualifiedType());
     await drugReceiptRegistry.update(drugReceipt);

     // emit event
     const buyEvent = factory.newEvent(namespace, 'buyEvent');
     buyEvent.drugReceipt = drugReceipt;
     emit(buyEvent);
 }
 /**
  * Close the Drug Receipt
  * @param {org.packt.farmatrace.Close} close - the Close transaction
  * @transaction
  */
 async function close(closeRequest) { 
     const factory = getFactory();
     const namespace = 'org.packt.farmatrace';

     let drugReceipt = closeRequest.drugReceipt;

     if (drugReceipt.currentStatus === 'CUSTOMER_RECEIVED') {
         drugReceipt.currentStatus = 'CLOSED';
         drugReceipt.closeReason = closeRequest.closeReason;

         // update the status of the drugReceipt
         const assetRegistry = await getAssetRegistry(closeRequest.drugReceipt.getFullyQualifiedType());
         await assetRegistry.update(drugReceipt);

         // emit event
         const closeEvent = factory.newEvent(namespace, 'CloseEvent');
         closeEvent.drugReceipt = closeRequest.drugReceipt;
         closeEvent.closeReason = closeRequest.closeReason;
         emit(closeEvent);
     } else if (drugReceipt.currentStatus === 'CLOSED') {
         throw new Error('This Drug Receipt  has already been closed');
     } else {
         throw new Error('Cannot close this Drug Receipt');
     }
 }