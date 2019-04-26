import sys
sys.path.insert(0, 'build/shared_model/bindings')
import iroha

import transaction_pb2
import endpoint_pb2
import endpoint_pb2_grpc
import queries_pb2
import grpc
import time


tx_builder = iroha.ModelTransactionBuilder()

crypto = iroha.ModelCrypto()
admin_priv = open("../admin@ico.priv", "r").read()
admin_pub = open("../admin@ico.pub", "r").read()
key_pair = crypto.convertFromExisting(admin_pub, admin_priv)

def current_time():
    return int(round(time.time() * 1000))

creator = "admin@ico"

def send_tx(tx, key_pair):
    tx_blob = iroha.ModelProtoTransaction(tx).signAndAddSignature(key_pair).finish().blob()
    proto_tx = transaction_pb2.Transaction()

    if sys.version_info[0] == 2:
        tmp = ''.join(map(chr, tx_blob))
    else:
        tmp = bytes(tx_blob)

    proto_tx.ParseFromString(tmp)

    channel = grpc.insecure_channel('127.0.0.1:50051')
    stub = endpoint_pb2_grpc.CommandServiceStub(channel)

    stub.Torii(proto_tx)

def transfer_hotcoin_from_admin_to_user():
    """
    Transfer 10 hotcoin from admin@ico to user@ico
    """
    tx = tx_builder.creatorAccountId(creator) \
        .createdTime(current_time()) \
        .transferAsset("admin@ico", "user@ico", "hotcoin#ico", "Transfer 10 from admin to user", "10.00").build()

    send_tx(tx, key_pair)
    print("Hash of the transaction: ", tx.hash().hex())

transfer_hotcoin_from_admin_to_user()
