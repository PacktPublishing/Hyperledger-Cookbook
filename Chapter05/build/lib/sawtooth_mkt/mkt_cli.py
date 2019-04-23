# Copyright 2017 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ------------------------------------------------------------------------------

from __future__ import print_function

import argparse
import getpass
import logging
import os
import traceback
import sys
import pkg_resources

from colorlog import ColoredFormatter

from sawtooth_mkt.mkt_client import MktClient
from sawtooth_mkt.mkt_exceptions import MktException


DISTRIBUTION_NAME = 'sawtooth-mkt'


DEFAULT_URL = 'http://127.0.0.1:8008'


def create_console_handler(verbose_level):
    clog = logging.StreamHandler()
    formatter = ColoredFormatter(
        "%(log_color)s[%(asctime)s %(levelname)-8s%(module)s]%(reset)s "
        "%(white)s%(message)s",
        datefmt="%H:%M:%S",
        reset=True,
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red',
        })

    clog.setFormatter(formatter)

    if verbose_level == 0:
        clog.setLevel(logging.WARN)
    elif verbose_level == 1:
        clog.setLevel(logging.INFO)
    else:
        clog.setLevel(logging.DEBUG)

    return clog


def setup_loggers(verbose_level):
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    logger.addHandler(create_console_handler(verbose_level))


def add_create_parser(subparsers, parent_parser):
    parser = subparsers.add_parser(
        'create',
        help='Creates a new house ',
        description='Sends a transaction to create house and owner '
        'identifier <name>. This transaction will fail if the specified '
        'house already exists.',
        parents=[parent_parser])

    parser.add_argument(
        'house',
        type=str,
        help='unique identifier for the new product')
    
    parser.add_argument(
        'owner',
        type=str,
        help='owner for the new house')

    parser.add_argument(
        '--url',
        type=str,
        help='specify URL of REST API')

    parser.add_argument(
        '--username',
        type=str,
        help="identify name of user's private key file")

    parser.add_argument(
        '--key-dir',
        type=str,
        help="identify directory of user's private key file")

    parser.add_argument(
        '--auth-user',
        type=str,
        help='specify username for authentication if REST API '
        'is using Basic Auth')

    parser.add_argument(
        '--auth-password',
        type=str,
        help='specify password for authentication if REST API '
        'is using Basic Auth')

    parser.add_argument(
        '--disable-client-validation',
        action='store_true',
        default=False,
        help='disable client validation')

    parser.add_argument(
        '--wait',
        nargs='?',
        const=sys.maxsize,
        type=int,
        help='set time, in seconds, to wait for txn to commit')


def add_list_parser(subparsers, parent_parser):
    parser = subparsers.add_parser(
        'list',
        help='Displays information for all house',
        description='Displays information for all house, showing '
        'house, owner',
        parents=[parent_parser])

    parser.add_argument(
        '--url',
        type=str,
        help='specify URL of REST API')

    parser.add_argument(
        '--username',
        type=str,
        help="identify name of user's private key file")

    parser.add_argument(
        '--key-dir',
        type=str,
        help="identify directory of user's private key file")

    parser.add_argument(
        '--auth-user',
        type=str,
        help='specify username for authentication if REST API '
        'is using Basic Auth')

    parser.add_argument(
        '--auth-password',
        type=str,
        help='specify password for authentication if REST API '
        'is using Basic Auth')

def add_transfer_parser(subparsers, parent_parser):
    parser = subparsers.add_parser(
        'transfer',
        help='transfer house to new owner',
        description='transfer transaction to new owner ',
        parents=[parent_parser])

    parser.add_argument(
        'house',
        type=str,
        help='identifier for the house')

    parser.add_argument(
        'owner',
        type=str,
        help='owner for the new house ')

    parser.add_argument(
        '--url',
        type=str,
        help='specify URL of REST API')

    parser.add_argument(
        '--username',
        type=str,
        help="identify name of user's private key file")

    parser.add_argument(
        '--key-dir',
        type=str,
        help="identify directory of user's private key file")

    parser.add_argument(
        '--auth-user',
        type=str,
        help='specify username for authentication if REST API '
        'is using Basic Auth')

    parser.add_argument(
        '--auth-password',
        type=str,
        help='specify password for authentication if REST API '
        'is using Basic Auth')

    parser.add_argument(
        '--wait',
        nargs='?',
        const=sys.maxsize,
        type=int,
        help='set time, in seconds, to wait for take transaction '
        'to commit')

def create_parent_parser(prog_name):
    parent_parser = argparse.ArgumentParser(prog=prog_name, add_help=False)
    parent_parser.add_argument(
        '-v', '--verbose',
        action='count',
        help='enable more verbose output')

    try:
        version = pkg_resources.get_distribution(DISTRIBUTION_NAME).version
    except pkg_resources.DistributionNotFound:
        version = 'UNKNOWN'

    parent_parser.add_argument(
        '-V', '--version',
        action='version',
        version=(DISTRIBUTION_NAME + ' (Hyperledger Sawtooth) version {}')
        .format(version),
        help='display version information')

    return parent_parser


def create_parser(prog_name):
    parent_parser = create_parent_parser(prog_name)

    parser = argparse.ArgumentParser(
        description='Provides subcommands to Marketplace sample',
        parents=[parent_parser])

    subparsers = parser.add_subparsers(title='subcommands', dest='command')

    subparsers.required = True

    add_create_parser(subparsers, parent_parser)
    add_list_parser(subparsers, parent_parser)
    add_transfer_parser(subparsers, parent_parser)

    return parser


def do_list(args):
    url = _get_url(args)
    auth_user, auth_password = _get_auth_info(args)

    client = MktClient(base_url=url, keyfile=None)

    house_list = [
        house.split(',')
        for houses in client.list(auth_user=auth_user,
                                 auth_password=auth_password)
        for house in houses.decode().split('|')
    ]

    if house_list is not None:
        fmt = "%-15s %-15s"
        print(fmt % ('HOUSE', 'OWNER'))
        for house_data in house_list:

            house, owner = house_data

            print(fmt % (house, owner))
    else:
        raise MktException("Could not retrieve house listing.")


def do_show(args):
    house = args.house

    url = _get_url(args)
    auth_user, auth_password = _get_auth_info(args)

    client = MktClient(base_url=url, keyfile=None)

    data = client.show(house, auth_user=auth_user, auth_password=auth_password)

    if data is not None:

        owner = {
            housedata: (ownerdata)
            for housedata, ownerdata in [
                houseowner.split(',')
                for houseowner in data.decode().split('|')
            ]
        }[house]

        print("HOUSE:   :{}".format(house))
        print("OWNER: :{}".format(owner))
        print("")
    else:
        raise MktException("Game not found: {}".format(name))


def do_create(args):
    house = args.house
    owner = args.owner

    url = _get_url(args)
    keyfile = _get_keyfile(args)
    auth_user, auth_password = _get_auth_info(args)

    client = MktClient(base_url=url, keyfile=keyfile)

    if args.wait and args.wait > 0:
        response = client.create(
            house, owner, wait=args.wait,
            auth_user=auth_user,
            auth_password=auth_password)
    else:
        response = client.create(
            house, owner, auth_user=auth_user,
            auth_password=auth_password)

    print("Response: {}".format(response))


def do_transfer(args):
    house = args.house
    owner = args.owner

    url = _get_url(args)
    keyfile = _get_keyfile(args)
    auth_user, auth_password = _get_auth_info(args)

    client = MktClient(base_url=url, keyfile=keyfile)

    if args.wait and args.wait > 0:
        response = client.transfer(
            house, owner, wait=args.wait,
            auth_user=auth_user,
            auth_password=auth_password)
    else:
        response = client.transfer(
            house, owner,
            auth_user=auth_user,
            auth_password=auth_password)

    print("Response: {}".format(response))


def _get_url(args):
    return DEFAULT_URL if args.url is None else args.url


def _get_keyfile(args):
    username = getpass.getuser() if args.username is None else args.username
    home = os.path.expanduser("~")
    key_dir = os.path.join(home, ".sawtooth", "keys")

    return '{}/{}.priv'.format(key_dir, username)


def _get_auth_info(args):
    auth_user = args.auth_user
    auth_password = args.auth_password
    if auth_user is not None and auth_password is None:
        auth_password = getpass.getpass(prompt="Auth Password: ")

    return auth_user, auth_password


def main(prog_name=os.path.basename(sys.argv[0]), args=None):
    if args is None:
        args = sys.argv[1:]
    parser = create_parser(prog_name)
    args = parser.parse_args(args)

    if args.verbose is None:
        verbose_level = 0
    else:
        verbose_level = args.verbose

    setup_loggers(verbose_level=verbose_level)

    if args.command == 'create':
        do_create(args)
    elif args.command == 'list':
        do_list(args)
    elif args.command == 'show':
        do_show(args)
    elif args.command == 'transfer':
        do_transfer(args)
    else:
        raise MktException("invalid command: {}".format(args.command))


def main_wrapper():
    try:
        main()
    except MktException as err:
        print("Error: {}".format(err), file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        pass
    except SystemExit as err:
        raise err
    except BaseException as err:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
