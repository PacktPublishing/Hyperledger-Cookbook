var express = require('express');
var app = express();

app.set('view engine', 'ejs')

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


app.get('/', function (req, res) {
  res.render('index');
});
app.get('/query', async function(req,res){
	const query_responses= await getQueuryResult();
	if (query_responses) {
           res.send(JSON.stringify(query_responses.toString()));
	} else {
	   console.log("No payloads were returned from query");
	}
});
app.post('/ship', async function(req,res){
	const query_responses= await ship();
	if (query_responses) {
       res.json('User added successfully');
	} else {
	   console.log("No payloads were returned from query");
	}
});
async function getQueuryResult() {
    try {

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('assetmgr');
        const result = await contract.evaluateTransaction('query', '100');
        //console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        return result;

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}
async function ship() {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('assetmgr');
        // Submit the specified transaction.
        await contract.submitTransaction("Ship", "100", "OEM deliver ipad to school", "New Jersey");
        console.log('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

