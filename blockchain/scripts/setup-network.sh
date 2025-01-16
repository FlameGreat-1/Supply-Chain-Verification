#!/bin/bash

# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

starttime=$(date +%s)

# Clean up any previous network artifacts
docker-compose -f ../network/docker-compose.yml down --volumes --remove-orphans

# Create the channel and join peers to the channel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block

# Update anchor peers
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel update -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/Org1MSPanchors.tx

# Install chaincode on peer0.org1.example.com
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/product-tracking
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/ethical-sourcing
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/verification

# Instantiate chaincode on mychannel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n mycc -v 1.0 -c '{"Args":[]}' -P "OR ('Org1MSP.member')"

# Wait for chaincode instantiation
sleep 10

echo "===================== Network setup completed ===================== "

cat <<EOF

Total setup execution time : $(($(date +%s) - starttime)) secs ...

Next steps:
  - Use the deploy-chaincode.sh script to deploy updated chaincode
  - Use the invokeChaincode function in your application to interact with the chaincode
  - Use the queryChaincode function in your application to query the ledger

EOF
