#!/bin/bash

# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

starttime=$(date +%s)

# Upgrade chaincode on peer0.org1.example.com
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode install -n mycc -v 2.0 -p github.com/chaincode/product-tracking
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode install -n mycc -v 2.0 -p github.com/chaincode/ethical-sourcing
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode install -n mycc -v 2.0 -p github.com/chaincode/verification

# Upgrade chaincode on mychannel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer chaincode upgrade -o orderer.example.com:7050 -C mychannel -n mycc -v 2.0 -c '{"Args":[]}' -P "OR ('Org1MSP.member')"

# Wait for chaincode upgrade
sleep 10

echo "===================== Chaincode upgrade completed ===================== "

cat <<EOF

Total upgrade execution time : $(($(date +%s) - starttime)) secs ...

Next steps:
  - Use the invokeChaincode function in your application to interact with the updated chaincode
  - Use the queryChaincode function in your application to query the ledger with the updated chaincode

EOF
