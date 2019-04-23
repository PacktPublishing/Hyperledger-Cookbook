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

import os
import subprocess

from setuptools import setup, find_packages

data_files = []

if os.path.exists("/etc/default"):
    data_files.append(
        ('/etc/default', ['sawtooth_mkt/packaging/systemd/sawtooth-mkt-tp-python']))

if os.path.exists("/lib/systemd/system"):
    data_files.append(('/lib/systemd/system',
                       ['sawtooth_mkt/packaging/systemd/sawtooth-mkt-tp-python.service']))

setup(
    name='sawtooth-mkt',
    version='1.0.4',
    description='Sawtooth MKT Example',
    author='Hyperledger Sawtooth',
    url='https://github.com/hyperledger/sawtooth-core',
    packages=find_packages(),
    install_requires=[
        'aiohttp',
        'colorlog',
        'protobuf',
        'sawtooth-sdk',
        'sawtooth-signing',
        'PyYAML',
    ],
    data_files=data_files,
    entry_points={
        'console_scripts': [
            'mkt = sawtooth_mkt.mkt_cli:main_wrapper',
            'mkt-tp-python = sawtooth_mkt.processor.main:main',
        ]
    })
