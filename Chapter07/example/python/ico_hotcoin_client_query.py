import sys
sys.path.insert(0, 'build/shared_model/bindings')
import iroha

import transaction_pb2
import endpoint_pb2
import endpoint_pb2_grpc
import queries_pb2
import grpc
import time


query_builder = iroha.ModelQueryBuilder()

crypto = iroha.ModelCrypto()
admin_priv = open("../admin@ico.priv", "r").read()
admin_pub = open("../admin@ico.pub", "r").read()
key_pair = crypto.convertFromExisting(admin_pub, admin_priv)

def current_time():
    return int(round(time.time() * 1000))

creator = "admin@ico"

query_counter = 1

def send_query(query, key_pair):
    query_blob = iroha.ModelProtoQuery(query).signAndAddSignature(key_pair).finish().blob()

    proto_query = queries_pb2.Query()

    if sys.version_info[0] == 2:
        tmp = ''.join(map(chr, query_blob))
    else:
        tmp = bytes(query_blob)

    proto_query.ParseFromString(tmp)

    channel = grpc.insecure_channel('127.0.0.1:50051')
    query_stub = endpoint_pb2_grpc.QueryServiceStub(channel)
    query_response = query_stub.Find(proto_query)

    return query_response


def get_admin_hotcoin_balance():
    """
    Get the hotcoin balance after the transfer for amin@ico asset hotcoin#ico
    """
    global query_counter
    query_counter += 1
    query = query_builder.creatorAccountId(creator) \
        .createdTime(current_time()) \
        .queryCounter(query_counter) \
        .getAccountAssets("admin@ico") \
        .build()

    query_response = send_query(query, key_pair)

    print(query_response)

get_admin_hotcoin_balance()
