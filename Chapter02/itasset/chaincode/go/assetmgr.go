package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type AssetMgr struct {
}

// ============================================================================================================================
// define OrgAsset struct
// ============================================================================================================================
type OrgAsset struct {
	Id        string `json:"id"`        //the assetId
	AssetType string `json:"assetType"` //type of device
	Status    string `json:"status"`    //status of asset
	Location  string `json:"location"`  //device location
	DeviceId  string `json:"deviceId"`  //DeviceId
	Comment   string `json:"comment"`   //comment
	From      string `json:"from"`      //from
	To        string `json:"to"`        //to
}

func (c *AssetMgr) Init(stub shim.ChaincodeStubInterface) pb.Response {
	args := stub.GetStringArgs()
	if len(args) != 3 {
		return shim.Error("Incorrect arguments. Expecting a key and a value")
	}
	assetId := args[0]
	assetType := args[1]
	deviceId := args[2]

	//create asset
	assetData := OrgAsset{
		Id:        assetId,
		AssetType: assetType,
		Status:    "START",
		Location:  "N/A",
		DeviceId:  deviceId,
		Comment:   "Initialized asset",
		From:      "N/A",
		To:        "N/A"}
	assetBytes, _ := json.Marshal(assetData)
	assetErr := stub.PutState(assetId, assetBytes)
	if assetErr != nil {
		return shim.Error(fmt.Sprintf("Failed to create asset: %s", args[0]))
	}
	return shim.Success(nil)
}

// ============================================================================================================================
// Dynamic Invoke Asset management function
// ============================================================================================================================
func (c *AssetMgr) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	if function == "Order" {
		return c.Order(stub, args)
	} else if function == "Ship" {
		return c.Ship(stub, args)
	} else if function == "Distribute" {
		return c.Distribute(stub, args)
	} else if function == "query" {
		return c.query(stub, args)
	} else if function == "getHistory" {
		return c.getHistory(stub, args)
	}

	return shim.Error("Invalid function name")
}

// ============================================================================================================================
// school order a device from OEM
// ============================================================================================================================
func (c *AssetMgr) Order(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return c.UpdateAsset(stub, args, "ORDER", "SCHOOL", "OEM")
}

// ============================================================================================================================
// OEM ship device to school
// ============================================================================================================================
func (c *AssetMgr) Ship(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return c.UpdateAsset(stub, args, "SHIP", "OEM", "SCHOOL")
}

// ============================================================================================================================
//  School distribute device to students
// ============================================================================================================================
func (c *AssetMgr) Distribute(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return c.UpdateAsset(stub, args, "DISTRIBUTE", "SCHOOL", "STUDENT")
}

// ============================================================================================================================
// update Asset data in blockchain
// ============================================================================================================================
func (c *AssetMgr) UpdateAsset(stub shim.ChaincodeStubInterface, args []string, currentStatus string, from string, to string) pb.Response {
	assetId := args[0]
	comment := args[1]
	location := args[2]
	assetBytes, err := stub.GetState(assetId)
	orgAsset := OrgAsset{}
	err = json.Unmarshal(assetBytes, &orgAsset)

	if err != nil {
		return shim.Error(err.Error())
	}
	if currentStatus == "ORDER" && orgAsset.Status != "START" {
		orgAsset.Status = "Error"
		fmt.Printf("orgAsset is not started yet")
		return shim.Error(err.Error())
	} else if currentStatus == "SHIP" && orgAsset.Status != "ORDER" {
		orgAsset.Status = "Error"
		fmt.Printf("orgAsset must be in ORDER status")
		return shim.Error(err.Error())
	} else if currentStatus == "DISTRIBUTE" && orgAsset.Status != "SHIP" {
		orgAsset.Status = "Error"
		fmt.Printf("orgAsset must be in SHIP status")
		return shim.Error(err.Error())
	}
	orgAsset.Comment = comment
	orgAsset.Status = currentStatus
	orgAsset.From = from
	orgAsset.To = to
	orgAsset.Location = location
	orgAsset0, _ := json.Marshal(orgAsset)
	err = stub.PutState(assetId, orgAsset0)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(orgAsset0)
}

// ============================================================================================================================
// Get Asset Data By Query Asset By ID
//
// ============================================================================================================================
func (c *AssetMgr) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var ENIITY string
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expected ENIITY Name")
	}

	ENIITY = args[0]
	Avalbytes, err := stub.GetState(ENIITY)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + ENIITY + "\"}"
		return shim.Error(jsonResp)
	}

	if Avalbytes == nil {
		jsonResp := "{\"Error\":\"Nil order for " + ENIITY + "\"}"
		return shim.Error(jsonResp)
	}

	return shim.Success(Avalbytes)
}

// ============================================================================================================================
// Get history of asset
//
// Shows Off GetHistoryForKey() - reading complete history of a key/value
//
// ============================================================================================================================
func (c *AssetMgr) getHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	type AuditHistory struct {
		TxId  string   `json:"txId"`
		Value OrgAsset `json:"value"`
	}
	var history []AuditHistory
	var orgAsset OrgAsset

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	assetId := args[0]
	fmt.Printf("- start getHistoryForAsset: %s\n", assetId)

	// Get History
	resultsIterator, err := stub.GetHistoryForKey(assetId)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		var tx AuditHistory
		tx.TxId = historyData.TxId
		json.Unmarshal(historyData.Value, &orgAsset)
		tx.Value = orgAsset           //copy orgAsset over
		history = append(history, tx) //add this tx to the list
	}
	fmt.Printf("- getHistoryForAsset returning:\n%s", history)

	//change to array of bytes
	historyAsBytes, _ := json.Marshal(history) //convert to array of bytes
	return shim.Success(historyAsBytes)
}
func main() {

	err := shim.Start(new(AssetMgr))
	if err != nil {
		fmt.Printf("Error creating new AssetMgr Contract: %s", err)
	}
}

