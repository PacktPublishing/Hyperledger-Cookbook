#!/bin/bash
##
# SPDX-License-Identifier: Apache-2.0
#
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CC_RUNTIME_LANGUAGE=golang
CC_SRC_PATH=github.com/assetmgr

# clean the keystore
rm -rf ./hfc-key-store

# launch network; create channel and join peer to channel
cd /home/ubuntu/fabric-samples/basic-network
./start.sh

# bring up cli cntainer to install, instantiate, invoke chaincode
docker-compose -f ./docker-compose.yml up -d cli

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n assetmgr -v 1.0 -p "$CC_SRC_PATH" -l "$CC_RUNTIME_LANGUAGE"
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n assetmgr -l "$CC_RUNTIME_LANGUAGE" -v 1.0 -c '{"Args":["100","ipad", "0e83ff"]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
sleep 10
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n assetmgr -c '{"Args":["Order", "100", "initial order from school", "New York"]}'

echo "Total setup execution time : $(($(date +%s) - starttime)) secs ..."
