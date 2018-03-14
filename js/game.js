$(document).ready(() => {

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

    let selectedVirus = '';

    const pages = {};
    
    web3.eth.getAccounts().then((accounts) => {

        const VirusGame = new web3.eth.Contract(abi, '0xf5fcfea8331a44a5a7239bc75bc8b3cf4e2193e0', {
            from: accounts[0]
        });

        const defaultAccount = accounts[0];

        function mutate(name, hash, generation) {
            //console.log(web3.utils.hexToBytes(web3.utils.utf8ToHex(name))); return;
            name = web3.utils.utf8ToHex(name);
            VirusGame.methods.mutate(hash, name).send({
                value: 10000000000000000 + (1000000000000000 * generation),
                gas: 400000
            }).then(() => {
                return true;
            });
        }
        
        function infect(hash) {
            VirusGame.methods.infect(hash).send({
                gas: 200000
            }).then(() => {
                return true;
            });
        }
        
        function withdraw(hash) {
            VirusGame.methods.withdraw(hash).send({
                gas: 200000
            }).then(() => {
                return true;
            });
        }

        /*VirusGame.methods.virusHashes(0).call().then((res) => {
            return VirusGame.methods.virus(res).call().then((virus) => {
                return console.log(virus);
            });
        });*/

        pages.landing = () => {
            VirusGame.methods.totalInfected().call().then((totalInfected) => {
                $('#totalInfected').html(totalInfected);
            });
            
            VirusGame.methods.totalPopulation().call().then((totalPopulation) => {
                $('#totalPopulation').html(totalPopulation);
            });

            VirusGame.methods.getVirusLength().call().then((virusLength) => {
                $('#latest-virus').html('');
                for (let i = virusLength; i > (virusLength - 5); i--) {
                    if (i <= 0) break;
                    VirusGame.methods.virusHashes(i - 1).call().then((virusHash) => {
                        return VirusGame.methods.virus(virusHash).call().then((virus) => {
                            $('#latest-virus').append(
                                '<div class="virus-card">' +
                                    '<div class="virus-card-title">' + web3.utils.toAscii(virus.name.replace(/<(\w)/, '< $1')) + '</div>' +
                                    '<canvas id="card' + virusHash + '" class="virus-card-canvas"></canvas>' +
                                    '<div class="virus-card-content">' + 
                                        'Generation: ' + virus.generation + '<br />' +
                                        'Potential: ' + virus.potential + '<br />' +
                                        'Infected: ' + virus.infected + '<br /><br />' +
                                        '<button id="details' + virusHash + '">Details</button> ' +
                                    '</div>' +
                                '</div>'
                            );

                            $('#details' + virusHash).unbind('click').click(() => {
                                showPage(virusHash);
                            });

                            showDNA('card' + virusHash, virusHash);

                            return virus;
                        });
                    });
                }

                return true;
            });
        };

        pages.account = () => {
            VirusGame.methods.getOwnerVirusLength(defaultAccount).call().then((virusLength) => {
                $('#account-virus').html('');
                if (virusLength == 0) $('#account-virus').html('You have no viruses!');
                for (let i = virusLength; i > 0; i--) {
                    VirusGame.methods.virusOwner(defaultAccount, i - 1).call().then((virusHash) => {
                        return VirusGame.methods.virus(virusHash).call().then((virus) => {
                            $('#account-virus').append(
                                '<div class="virus-row">' +
                                    '<div class="virus-row-title">' + web3.utils.toAscii(virus.name.replace(/<(\w)/, '< $1')) + '</div>' +
                                    '<div class="virus-row-content">' + 
                                        'Generation: ' + virus.generation + ' - ' +
                                        'Potential: ' + virus.potential + ' - ' +
                                        'Infected: ' + virus.infected +
                                    '</div>' +
                                    '<button id="accountDetails' + virusHash + '" class="virus-row-details">Details</button> ' +
                                '</div>'
                            );

                            $('#accountDetails' + virusHash).unbind('click').click(() => {
                                showPage(virusHash);
                            });

                            return virus;
                        });
                    });
                }

                return true;
            });
        };
        
        pages.virus = () => {
            VirusGame.methods.virus(selectedVirus).call().then((virus) => {
                $('#virus-name').html(web3.utils.toAscii(virus.name.replace(/<(\w)/, '< $1')));
                $('#virus-generation').html(virus.generation);
                $('#virus-potential').html(virus.potential);
                $('#virus-infected').html(virus.infected);
                const delay = ((Date.now() / 1000) - virus.lastInfected) / (24 * 60 * 60);
                $('#virus-to-infect').html(parseInt(virus.infectedTriggle) + parseInt(virus.potential * delay));

                VirusGame.methods.totalBalance().call().then((totalBalance) => {
                    return VirusGame.methods.totalPayed().call().then((totalPayed) => {
                        return VirusGame.methods.totalInfected().call().then((totalInfected) => {
                            const toBePayed = virus.infected - virus.infectedPayed;
                            let value = (totalBalance / (totalInfected - totalPayed) * toBePayed) / 1000000000000000000;
                            if ((totalInfected - totalPayed) == 0) value = 0;
                            $('#virus-value').html(value + ' Ether');

                            return true;
                        });
                    });
                });

                if (virus.generation == 0) {
                    $('#virus-parent').hide();
                    $('#virus-value').html('&#8734;');
                } else {
                    $('#virus-parent').show();
                    $('#virus-parent').unbind('click').click(() => {
                        showPage(virus.parent);
                    });
                }

                if (virus.owner == defaultAccount) {
                    $('#virus-infect').show();
                    $('#virus-withdraw').show();
                    
                    $('#virus-infect').unbind('click').click(() => {
                        infect(selectedVirus);
                    });

                    $('#virus-withdraw').unbind('click').click(() => {
                        withdraw(selectedVirus);
                    });
                } else {
                    $('#virus-infect').hide();
                    $('#virus-withdraw').hide();
                }

                $('#virus-mutate').html('Mutate (Costs: ' + (0.01 + (0.001 * virus.generation)).toFixed(3) + ' Ether)');
                $('#virus-mutate').unbind('click').click(() => {
                    if (!$('#virus-mutation-name').val()) {
                       alert('Please enter a name!');
                       return;
                    }

                    mutate($('#virus-mutation-name').val(), selectedVirus, virus.generation);

                    $('#virus-mutation-name').val('');
                });

                showDNA('virus-canvas', selectedVirus);

                return virus;
            });
        };

        pages.landing();

        /*web3.eth.subscribe('logs', {}, (error, log) => {
            if (error) console.log(error);
        }).on('data', () => {

        });*/

        return true;
    });

    function showDNA(elementId, virusHash) {
        const engine = new BABYLON.Engine($('#' + elementId)[0], true);
        engine.enableOfflineSupport = false;
        const scene = new BABYLON.Scene(engine);
        const assetsManager = new BABYLON.AssetsManager(scene);

        assetsManager.addMeshTask('dna task', 'DNA', 'assets/', 'dna.babylon');

        const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(20, 50, -2), scene);
        camera.setTarget(new BABYLON.Vector3(0, 40, 0));

        // set between 0.8 and -0.8
        camera.rotation.z = 1.6 * intFromHash(virusHash) / 100000 - 0.8;

        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
        //const light2 = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(15, 45, -15), new BABYLON.Vector3(0, 40, 0), Math.PI / 3, 2, scene);

        scene.clearColor = BABYLON.Color4.FromHexString('#121627FF');

        assetsManager.onFinish = (tasks) => {
            //const texture = BABYLON.Texture.CreateFromBase64String(generateTexture(virusHash), 'texture' + virusHash, scene); 

            var material = new BABYLON.StandardMaterial('material' + virusHash, scene);
            material.diffuseColor = generateColor(virusHash);
            //material.diffuseTexture = texture;

            tasks[0].loadedMeshes[0].material = material;
            
            engine.runRenderLoop(() => {
                tasks[0].loadedMeshes[0].rotation.y += 0.035;
                scene.render();
            });
        };

        assetsManager.load();
    }

    function generateColor(virusHash) {
        /*const texture = new TG.Texture( 256, 256 )
            .add( new TG.XOR().tint( 1, 0.5, 0.7 ) )
            .add( new TG.SinX().frequency( 0.004 ).tint( 0.5, 0, 0 ) )
            .mul( new TG.SinY().frequency( 0.004 ).tint( 0.5, 0, 0 ) )
            .add( new TG.SinX().frequency( 0.0065 ).tint( 0.1, 0.5, 0.2 ) )
            //.add( new TG.SinY().frequency( 0.0065 ).tint( 0.5, 0.5, 0.5 ) )
            .add( new TG.Noise().tint( 0.1, 0.1, 0.2 ) )
            .toCanvas();

        $('#log').html('<img src="' + texture.toDataURL("image/png") + '" />');*/
        const red = intFromHash(newHashFromHash(virusHash, 1, 4, 9, 12, 10)) / 100000;
        const green = intFromHash(newHashFromHash(virusHash, 23, 1, 6, 7, 19)) / 100000;
        const blue = intFromHash(newHashFromHash(virusHash, 14, 3, 21, 8, 16)) / 100000;

        //console.log(red + '/' + green + '/' + blue);

        return new BABYLON.Color3(red, green, blue);
        //return new BABYLON.Color3(0.3, 0.5, 0);
    }

    function fillMap(elementId, virusHash) {
        // on the main world map use genesisVirus

        // if main world -> 10000 per point instead of 100
    }

    function newHashFromHash(hash) {
        let newHashSeed = '';
        for (let i = 1; i < arguments.length; i++) {
            newHashSeed += hash.charAt(arguments[i]);
        }

        return web3.utils.soliditySha3(newHashSeed);
    }

    function intFromHash(hash) {
        return parseInt(hash, 16) % 100000;
    }

    function showPage(page) {
        if (page === 'index') {
            $('#account').hide();
            $('#virus').hide();
            $('#landing').show();
            pages.landing();
        } else if (page === 'account') {
            $('#virus').hide();
            $('#landing').hide();
            $('#account').show();
            pages.account();

        } else {
            selectedVirus = page;
            $('#account').hide();
            $('#landing').hide();
            $('#virus').show();
            pages.virus();
        }
    }

    $('#homeButton').unbind('click').click(() => {
        showPage('index');
    });
    
    $('#accountButton').unbind('click').click(() => {
        showPage('account');
    });

    const abi = [
      {
        "constant": true,
        "inputs": [],
        "name": "totalInfected",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getVirusLength",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalPopulation",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_angle",
            "type": "uint16"
          }
        ],
        "name": "cos",
        "outputs": [
          {
            "name": "",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_virus",
            "type": "bytes32"
          },
          {
            "name": "_name",
            "type": "bytes32"
          }
        ],
        "name": "mutate",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_virus",
            "type": "bytes32"
          }
        ],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "virusHashes",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBalance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_withdraw",
            "type": "address"
          }
        ],
        "name": "withdrawExcess",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_virus",
            "type": "bytes32"
          }
        ],
        "name": "infect",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalPayed",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "name": "genesisVirus",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          },
          {
            "name": "parent",
            "type": "bytes32"
          },
          {
            "name": "potential",
            "type": "uint256"
          },
          {
            "name": "infected",
            "type": "uint256"
          },
          {
            "name": "infectedPayed",
            "type": "uint256"
          },
          {
            "name": "infectedTriggle",
            "type": "uint256"
          },
          {
            "name": "lastWithdraw",
            "type": "uint256"
          },
          {
            "name": "lastInfected",
            "type": "uint256"
          },
          {
            "name": "generation",
            "type": "uint256"
          },
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "name": "virus",
        "outputs": [
          {
            "name": "name",
            "type": "bytes32"
          },
          {
            "name": "parent",
            "type": "bytes32"
          },
          {
            "name": "potential",
            "type": "uint256"
          },
          {
            "name": "infected",
            "type": "uint256"
          },
          {
            "name": "infectedPayed",
            "type": "uint256"
          },
          {
            "name": "infectedTriggle",
            "type": "uint256"
          },
          {
            "name": "lastWithdraw",
            "type": "uint256"
          },
          {
            "name": "lastInfected",
            "type": "uint256"
          },
          {
            "name": "generation",
            "type": "uint256"
          },
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newOwner",
            "type": "address"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "transferOwnership",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "virusOwner",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_angle",
            "type": "uint16"
          }
        ],
        "name": "sin",
        "outputs": [
          {
            "name": "",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "constant": true,
        "name": "getOwnerVirusLength",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ]
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "parentHash",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "name": "virusHash",
            "type": "bytes32"
          }
        ],
        "name": "LogMutation",
        "type": "constructor",
        "payable": false,
        "stateMutability": "nonpayable"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "parentHash",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "name": "virusHash",
            "type": "bytes32"
          }
        ],
        "name": "LogMutation",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "infected",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "virusHash",
            "type": "bytes32"
          }
        ],
        "name": "LogInfection",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "LogEndOfWorld",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      }
    ];

});
