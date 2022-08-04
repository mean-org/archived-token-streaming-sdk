export type Msp = {
  "version": "2.8.0",
  "name": "msp",
  "instructions": [
    {
      "name": "createTreasury",
      "docs": [
        "Create Treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "slot",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "treasuryType",
          "type": "u8"
        },
        {
          "name": "autoClose",
          "type": "bool"
        },
        {
          "name": "solFeePayedByTreasury",
          "type": "bool"
        },
        {
          "name": "category",
          "type": {
            "defined": "Category"
          }
        },
        {
          "name": "subCategory",
          "type": {
            "defined": "SubCategory"
          }
        }
      ]
    },
    {
      "name": "createStream",
      "docs": [
        "Create Stream"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateAmountUnits",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "allocationAssignedUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestAmountUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        }
      ]
    },
    {
      "name": "createStreamTemplate",
      "docs": [
        "Create template"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "durationNumberOfUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        }
      ]
    },
    {
      "name": "modifyStreamTemplate",
      "docs": [
        "Edit template"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "durationNumberOfUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        }
      ]
    },
    {
      "name": "createTreasuryAndTemplate",
      "docs": [
        "Create Treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "treasuryType",
          "type": "u8"
        },
        {
          "name": "autoClose",
          "type": "bool"
        },
        {
          "name": "solFeePayedByTreasury",
          "type": "bool"
        },
        {
          "name": "category",
          "type": {
            "defined": "Category"
          }
        },
        {
          "name": "subCategory",
          "type": {
            "defined": "SubCategory"
          }
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "durationNumberOfUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        },
        {
          "name": "slot",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createStreamWithTemplate",
      "docs": [
        "Create stream with template"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "rateAmountUnits",
          "type": "u64"
        },
        {
          "name": "allocationAssignedUnits",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "beneficiary",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "beneficiaryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pauseStream",
      "docs": [
        "Pause Stream"
      ],
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "resumeStream",
      "docs": [
        "Resume Stream"
      ],
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "refreshTreasuryData",
      "docs": [
        "Refresh Treasury Balance"
      ],
      "accounts": [
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferStream",
      "docs": [
        "Transfer Stream"
      ],
      "accounts": [
        {
          "name": "beneficiary",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "newBeneficiary",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "getStream",
      "docs": [
        "Get Stream"
      ],
      "accounts": [
        {
          "name": "stream",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addFunds",
      "docs": [
        "Adds funds the treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "contributor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "contributorToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "allocate",
      "docs": [
        "Allocate units to a stream"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closeStream",
      "docs": [
        "Close Stream"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiaryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closeTreasury",
      "docs": [
        "Close Treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "destinationAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "treasuryWithdraw",
      "docs": [
        "Withdraw unallocated funds from treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "destinationAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "stream",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "treasurerAddress",
            "type": "publicKey"
          },
          {
            "name": "rateAmountUnits",
            "type": "u64"
          },
          {
            "name": "rateIntervalInSeconds",
            "type": "u64"
          },
          {
            "name": "startUtc",
            "docs": [
              "The start timestamp in seconds"
            ],
            "type": "u64"
          },
          {
            "name": "cliffVestAmountUnits",
            "docs": [
              "The amount availaible to withdraw inmidiately (without streaming)",
              "once the money stream starts.",
              "If both 'cliff_vest_amount_units' and 'cliff_vest_percent' are provided, the former will be used."
            ],
            "type": "u64"
          },
          {
            "name": "cliffVestPercent",
            "docs": [
              "The percent of the allocation assigned that is availaible to withdraw",
              "inmidiately (without streaming) once the money stream starts.",
              "If both 'cliff_vest_amount_units' and 'cliff_vest_percent' are provided, the second (this field) will be used."
            ],
            "type": "u64"
          },
          {
            "name": "beneficiaryAddress",
            "type": "publicKey"
          },
          {
            "name": "beneficiaryAssociatedToken",
            "type": "publicKey"
          },
          {
            "name": "treasuryAddress",
            "type": "publicKey"
          },
          {
            "name": "allocationAssignedUnits",
            "docs": [
              "Amount of tokens allocated to the stream on creation or top up. If the",
              "treasurer decides to close the stream, the vested amount will be sent",
              "to the benefifiary and the unvested amount will be sent to the",
              "treasurer",
              "",
              "The allocation assigned will be affected by the following instructions:",
              "`addFunds`"
            ],
            "type": "u64"
          },
          {
            "name": "allocationReservedUnits",
            "docs": [
              "Amount of tokens reserved to the stream. If the treasurer decides to",
              "close the stream, the total amount (vested and unvested) WILL be sent",
              "to the beneficiary",
              "",
              "[deprecated] The allocation reserved will be affected by the following instructions:",
              "`addFunds`"
            ],
            "type": "u64"
          },
          {
            "name": "totalWithdrawalsUnits",
            "docs": [
              "Withdrawal tracking",
              "The total amount that has been withdrawn by the beneficiary"
            ],
            "type": "u64"
          },
          {
            "name": "lastWithdrawalUnits",
            "docs": [
              "The last amount withdrew by the beneficiary"
            ],
            "type": "u64"
          },
          {
            "name": "lastWithdrawalSlot",
            "docs": [
              "The slot number when the last withdrawal was executed"
            ],
            "type": "u64"
          },
          {
            "name": "lastWithdrawalBlockTime",
            "docs": [
              "The blocktime value when the last withdrawal was executed"
            ],
            "type": "u64"
          },
          {
            "name": "lastManualStopWithdrawableUnitsSnap",
            "docs": [
              "How can a stream STOP? -> There are 2 ways:",
              "1) by a Manual Action (recordable when it happens) or",
              "2) by Running Out Of Funds (not recordable when it happens, needs to be calculated)"
            ],
            "type": "u64"
          },
          {
            "name": "lastManualStopSlot",
            "type": "u64"
          },
          {
            "name": "lastManualStopBlockTime",
            "type": "u64"
          },
          {
            "name": "lastManualResumeRemainingAllocationUnitsSnap",
            "docs": [
              "The remaining allocation units at the moment of the last manual resume",
              "must be set when calling the Resume Stream"
            ],
            "type": "u64"
          },
          {
            "name": "lastManualResumeSlot",
            "type": "u64"
          },
          {
            "name": "lastManualResumeBlockTime",
            "type": "u64"
          },
          {
            "name": "lastKnownTotalSecondsInPausedStatus",
            "docs": [
              "The total seconds that have been paused since the start_utc",
              "increment when resume is called manually"
            ],
            "type": "u64"
          },
          {
            "name": "lastAutoStopBlockTime",
            "docs": [
              "The last blocktime when the stream was stopped",
              "either manually or automaticaly (run out of funds)"
            ],
            "type": "u64"
          },
          {
            "name": "feePayedByTreasurer",
            "type": "bool"
          },
          {
            "name": "startUtcInSeconds",
            "docs": [
              "The start timestamp blocktime"
            ],
            "type": "u64"
          },
          {
            "name": "createdOnUtc",
            "docs": [
              "Unix timestamp (in seconds) when the stream was created"
            ],
            "type": "u64"
          },
          {
            "name": "category",
            "docs": [
              "Indicates the main product category such as `Vesting(1)`",
              "The default value is set to a `Default(0)` cateogry."
            ],
            "type": "u8"
          },
          {
            "name": "subCategory",
            "docs": [
              "Indicates the sub product category such as `Advisor(1)`, Development(2)",
              "The default value is set to a `Default(0)` sub_cateogry."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "streamTemplate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "startUtcInSeconds",
            "docs": [
              "The start timestamp blocktime"
            ],
            "type": "u64"
          },
          {
            "name": "cliffVestPercent",
            "docs": [
              "The percentage availaible to withdraw inmidiately (without streaming)",
              "once the money stream starts."
            ],
            "type": "u64"
          },
          {
            "name": "rateIntervalInSeconds",
            "type": "u64"
          },
          {
            "name": "durationNumberOfUnits",
            "type": "u64"
          },
          {
            "name": "feePayedByTreasurer",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "slot",
            "type": "u64"
          },
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "treasurerAddress",
            "type": "publicKey"
          },
          {
            "name": "associatedTokenAddress",
            "type": "publicKey"
          },
          {
            "name": "mintAddress",
            "docs": [
              "[deprecated] The address of the Mint of the treasury pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "labels",
            "docs": [
              "This field should not be used in its current form because it has a dynamic size",
              "",
              "The 4-bytes header can be repurposed in the future"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "lastKnownBalanceUnits",
            "docs": [
              "Treasury balance tracking",
              "The last known treasury balance (will be updated in the `refreshTreasuryData` instruction)"
            ],
            "type": "u64"
          },
          {
            "name": "lastKnownBalanceSlot",
            "docs": [
              "The slot of the last time the treasury balance was updated"
            ],
            "type": "u64"
          },
          {
            "name": "lastKnownBalanceBlockTime",
            "docs": [
              "The blocktime when the treasury balance was updated"
            ],
            "type": "u64"
          },
          {
            "name": "allocationAssignedUnits",
            "docs": [
              "Treasury allocation tracking",
              "The allocation assigned accross all the streams that belong to this treasury",
              "",
              "The allocation assined will be modified in the following instructions:",
              "`createStream`, `allocate`, `withdraw` and `closeStream`"
            ],
            "type": "u64"
          },
          {
            "name": "allocationReservedUnits",
            "docs": [
              "The allocation reserved accross all the streams that belong to this treasury",
              "",
              "[deprecated] The allocation reserved will be modified in the following instructions:",
              "`createStream`, `withdraw` and `closeStream`"
            ],
            "type": "u64"
          },
          {
            "name": "totalWithdrawalsUnits",
            "docs": [
              "The total amount withdrawn by all the streams that belong to this treasury"
            ],
            "type": "u64"
          },
          {
            "name": "totalStreams",
            "docs": [
              "The current amount of streams in the treasury (will be updated in the `refreshTreasuryData` instruction)"
            ],
            "type": "u64"
          },
          {
            "name": "createdOnUtc",
            "type": "u64"
          },
          {
            "name": "treasuryType",
            "docs": [
              "The type of the treasury (Open, Locked)"
            ],
            "type": "u8"
          },
          {
            "name": "autoClose",
            "docs": [
              "only used for filtering in the ui"
            ],
            "type": "bool"
          },
          {
            "name": "solFeePayedByTreasury",
            "docs": [
              "Indicates whether program sol fees are payed from the `treasury`'s",
              "lamports balance (when true) or by the `payer` account in the",
              "transaction (when false)"
            ],
            "type": "bool"
          },
          {
            "name": "category",
            "docs": [
              "Indicates the main product category such as `Vesting(1)`",
              "The default value is set to a `Default(0)` cateogry."
            ],
            "type": "u8"
          },
          {
            "name": "subCategory",
            "docs": [
              "Indicates the sub product category such as `Advisor(1)`, Development(2)",
              "The default value is set to a `Default(0)` sub_cateogry."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Category",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Default"
          },
          {
            "name": "Vesting"
          }
        ]
      }
    },
    {
      "name": "SubCategory",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Default"
          },
          {
            "name": "Advisor"
          },
          {
            "name": "Development"
          },
          {
            "name": "Foundation"
          },
          {
            "name": "Investor"
          },
          {
            "name": "Marketing"
          },
          {
            "name": "Partnership"
          },
          {
            "name": "Seed"
          },
          {
            "name": "Team"
          },
          {
            "name": "Community"
          }
        ]
      }
    },
    {
      "name": "StreamStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Scheduled"
          },
          {
            "name": "Running"
          },
          {
            "name": "Paused"
          }
        ]
      }
    },
    {
      "name": "TreasuryType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Opened"
          },
          {
            "name": "Locked"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "StreamEvent",
      "fields": [
        {
          "name": "version",
          "type": "u8",
          "index": false
        },
        {
          "name": "initialized",
          "type": "bool",
          "index": false
        },
        {
          "name": "name",
          "type": "string",
          "index": false
        },
        {
          "name": "treasurerAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rateAmountUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64",
          "index": false
        },
        {
          "name": "startUtc",
          "type": "u64",
          "index": false
        },
        {
          "name": "cliffVestAmountUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "cliffVestPercent",
          "type": "u64",
          "index": false
        },
        {
          "name": "beneficiaryAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "beneficiaryAssociatedToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "treasuryAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "allocationAssignedUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "allocationReservedUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalWithdrawalsUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastWithdrawalUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastWithdrawalSlot",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastWithdrawalBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualStopWithdrawableUnitsSnap",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualStopSlot",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualResumeRemainingAllocationUnitsSnap",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualResumeSlot",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualResumeBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastKnownTotalSecondsInPausedStatus",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastAutoStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool",
          "index": false
        },
        {
          "name": "status",
          "type": "string",
          "index": false
        },
        {
          "name": "isManualPause",
          "type": "bool",
          "index": false
        },
        {
          "name": "cliffUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "currentBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "secondsSinceStart",
          "type": "u64",
          "index": false
        },
        {
          "name": "estDepletionTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "fundsLeftInStream",
          "type": "u64",
          "index": false
        },
        {
          "name": "fundsSentToBeneficiary",
          "type": "u64",
          "index": false
        },
        {
          "name": "withdrawableUnitsWhilePaused",
          "type": "u64",
          "index": false
        },
        {
          "name": "nonStopEarningUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "missedUnitsWhilePaused",
          "type": "u64",
          "index": false
        },
        {
          "name": "entitledEarningsUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "withdrawableUnitsWhileRunning",
          "type": "u64",
          "index": false
        },
        {
          "name": "beneficiaryRemainingAllocation",
          "type": "u64",
          "index": false
        },
        {
          "name": "beneficiaryWithdrawableAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastKnownStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "createdOnUtc",
          "type": "u64",
          "index": false
        },
        {
          "name": "category",
          "type": "u8",
          "index": false
        },
        {
          "name": "subCategory",
          "type": "u8",
          "index": false
        }
      ]
    },
    {
      "name": "CreateTreasuryEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "solDepositedForFees",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryType",
          "type": "u8",
          "index": false
        },
        {
          "name": "treasuryIsAutoClose",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CreateStreamEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamStartTs",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamRateAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamRateInterval",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamAllocation",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamCliff",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamWithdrawEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToBeneficiary",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamWithdrawableBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsManuallyPaused",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalWithdrawalsAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryTotalWithdrawalsAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamPauseEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamLastManualStopWithdrawableAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamResumeEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalSecondsInPausedStatusAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "TreasuryRefreshEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamTransferEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "previousBeneficiary",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newBeneficiary",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "TreasuryAddFundsEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamAllocateEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamStatusBefore",
          "type": "u32",
          "index": false
        },
        {
          "name": "streamWasManuallyPausedBefore",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamLastAutoStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalSecondsInPausedStatusAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CloseStreamEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToBeneficiary",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamAllocationBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalWithdrawalsBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryTotalStreamsAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CloseTreasuryEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToDestination",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "TreasuryWithdrawEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToDestination",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidProgramId",
      "msg": "Invalid Money Streaming Program ID"
    },
    {
      "code": 6001,
      "name": "InvalidOwner",
      "msg": "Invalid account owner"
    },
    {
      "code": 6002,
      "name": "NotAuthorized",
      "msg": "Not Authorized"
    },
    {
      "code": 6003,
      "name": "Overflow",
      "msg": "Overflow"
    },
    {
      "code": 6004,
      "name": "InvalidAssociatedToken",
      "msg": "Invalid associated token address"
    },
    {
      "code": 6005,
      "name": "InvalidFeeTreasuryAccount",
      "msg": "Invalid fee treasury account"
    },
    {
      "code": 6006,
      "name": "InvalidTreasuryMintDecimals",
      "msg": "Invalid treasury mint decimals"
    },
    {
      "code": 6007,
      "name": "TreasuryAlreadyInitialized",
      "msg": "Treasury is already initialized"
    },
    {
      "code": 6008,
      "name": "TreasuryNotInitialized",
      "msg": "Treasury is not initialized"
    },
    {
      "code": 6009,
      "name": "InvalidTreasuryVersion",
      "msg": "Invalid treasury version"
    },
    {
      "code": 6010,
      "name": "InvalidTreasuryMint",
      "msg": "Invalid treasury mint address"
    },
    {
      "code": 6011,
      "name": "InvalidTreasury",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6012,
      "name": "InvalidTreasurySize",
      "msg": "Invalid treasury size"
    },
    {
      "code": 6013,
      "name": "InvalidTreasurer",
      "msg": "Invalid treasurer"
    },
    {
      "code": 6014,
      "name": "InvalidBeneficiary",
      "msg": "Invalid beneficiary"
    },
    {
      "code": 6015,
      "name": "InvalidArgument",
      "msg": "Invalid argument"
    },
    {
      "code": 6016,
      "name": "StreamNotInitialized",
      "msg": "Stream not initialized"
    },
    {
      "code": 6017,
      "name": "StreamAlreadyInitialized",
      "msg": "Stream is already initialized"
    },
    {
      "code": 6018,
      "name": "InvalidStreamVersion",
      "msg": "Invalid stream version"
    },
    {
      "code": 6019,
      "name": "InvalidStreamSize",
      "msg": "Invalid stream size"
    },
    {
      "code": 6020,
      "name": "InvalidStream",
      "msg": "Invalid stream account"
    },
    {
      "code": 6021,
      "name": "InvalidRequestedStreamAllocation",
      "msg": "Invalid requested stream allocation"
    },
    {
      "code": 6022,
      "name": "InvalidWithdrawalAmount",
      "msg": "Invalid withdrawal amount"
    },
    {
      "code": 6023,
      "name": "StringTooLong",
      "msg": "The string length is larger than 32 bytes"
    },
    {
      "code": 6024,
      "name": "StreamAlreadyRunning",
      "msg": "The stream is already running"
    },
    {
      "code": 6025,
      "name": "StreamAlreadyPaused",
      "msg": "The stream is already paused"
    },
    {
      "code": 6026,
      "name": "StreamZeroRemainingAllocation",
      "msg": "Stream allocation assigned is zero"
    },
    {
      "code": 6027,
      "name": "ZeroContributionAmount",
      "msg": "Contribution amount is zero"
    },
    {
      "code": 6028,
      "name": "ZeroWithdrawalAmount",
      "msg": "Withdrawal amount is zero"
    },
    {
      "code": 6029,
      "name": "StreamIsScheduled",
      "msg": "Stream has not started"
    },
    {
      "code": 6030,
      "name": "CloseLockedStreamNotAllowedWhileRunning",
      "msg": "Streams in a Locked treasury can not be closed while running"
    },
    {
      "code": 6031,
      "name": "PauseOrResumeLockedStreamNotAllowed",
      "msg": "Streams in a Locked treasury can not be paused or resumed"
    },
    {
      "code": 6032,
      "name": "ReservedAllocationExceedWithdrawableAmount",
      "msg": "Can not pause a stream if the reserved allocation is greater than the withdrawable amount"
    },
    {
      "code": 6033,
      "name": "AllocateNotAllowedOnLockedStreams",
      "msg": "Can not allocate funds to a stream from a locked treasury"
    },
    {
      "code": 6034,
      "name": "InvalidStreamRate",
      "msg": "Invalid stream rate"
    },
    {
      "code": 6035,
      "name": "InvalidCliff",
      "msg": "Invalid cliff"
    },
    {
      "code": 6036,
      "name": "InsufficientLamports",
      "msg": "Insufficient lamports"
    },
    {
      "code": 6037,
      "name": "TreasuryContainsStreams",
      "msg": "This treasury contains one or more streams"
    },
    {
      "code": 6038,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6039,
      "name": "InsufficientTreasuryBalance",
      "msg": "Insufficient treasury balance"
    },
    {
      "code": 6040,
      "name": "CannotResumeAutoPausedStream",
      "msg": "Stream is auto-paused. To resume use allocate"
    },
    {
      "code": 6041,
      "name": "CannotPauseAndUnpauseOnSameBlockTime",
      "msg": "Cannot pause and unpause on the same block time"
    },
    {
      "code": 6042,
      "name": "InvalidTreasuryRequestedAllocation",
      "msg": "Treasury allocation can not be greater than treasury balance"
    },
    {
      "code": 6043,
      "name": "InvalidIdlFileVersion",
      "msg": "Invalid IDL file version"
    },
    {
      "code": 6044,
      "name": "InvalidTotalStreamsInTreasury",
      "msg": "Invalid total streams in treasury"
    },
    {
      "code": 6045,
      "name": "InvalidTemplateVersion",
      "msg": "Invalid template version"
    },
    {
      "code": 6046,
      "name": "InvalidTemplateSize",
      "msg": "Invalid template size"
    },
    {
      "code": 6047,
      "name": "CannotModifyTemplate",
      "msg": "Template cannot be modified after streams have been created"
    }
  ]
};

export const IDL: Msp = {
  "version": "2.8.0",
  "name": "msp",
  "instructions": [
    {
      "name": "createTreasury",
      "docs": [
        "Create Treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "slot",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "treasuryType",
          "type": "u8"
        },
        {
          "name": "autoClose",
          "type": "bool"
        },
        {
          "name": "solFeePayedByTreasury",
          "type": "bool"
        },
        {
          "name": "category",
          "type": {
            "defined": "Category"
          }
        },
        {
          "name": "subCategory",
          "type": {
            "defined": "SubCategory"
          }
        }
      ]
    },
    {
      "name": "createStream",
      "docs": [
        "Create Stream"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateAmountUnits",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "allocationAssignedUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestAmountUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        }
      ]
    },
    {
      "name": "createStreamTemplate",
      "docs": [
        "Create template"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "durationNumberOfUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        }
      ]
    },
    {
      "name": "modifyStreamTemplate",
      "docs": [
        "Edit template"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "durationNumberOfUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        }
      ]
    },
    {
      "name": "createTreasuryAndTemplate",
      "docs": [
        "Create Treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "treasuryType",
          "type": "u8"
        },
        {
          "name": "autoClose",
          "type": "bool"
        },
        {
          "name": "solFeePayedByTreasury",
          "type": "bool"
        },
        {
          "name": "category",
          "type": {
            "defined": "Category"
          }
        },
        {
          "name": "subCategory",
          "type": {
            "defined": "SubCategory"
          }
        },
        {
          "name": "startUtc",
          "type": "u64"
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64"
        },
        {
          "name": "durationNumberOfUnits",
          "type": "u64"
        },
        {
          "name": "cliffVestPercent",
          "type": "u64"
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool"
        },
        {
          "name": "slot",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createStreamWithTemplate",
      "docs": [
        "Create stream with template"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "template",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "rateAmountUnits",
          "type": "u64"
        },
        {
          "name": "allocationAssignedUnits",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "beneficiary",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "beneficiaryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pauseStream",
      "docs": [
        "Pause Stream"
      ],
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "resumeStream",
      "docs": [
        "Resume Stream"
      ],
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "refreshTreasuryData",
      "docs": [
        "Refresh Treasury Balance"
      ],
      "accounts": [
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferStream",
      "docs": [
        "Transfer Stream"
      ],
      "accounts": [
        {
          "name": "beneficiary",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "newBeneficiary",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "getStream",
      "docs": [
        "Get Stream"
      ],
      "accounts": [
        {
          "name": "stream",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addFunds",
      "docs": [
        "Adds funds the treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "contributor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "contributorToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "allocate",
      "docs": [
        "Allocate units to a stream"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closeStream",
      "docs": [
        "Close Stream"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "beneficiary",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "beneficiaryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closeTreasury",
      "docs": [
        "Close Treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "destinationAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "treasuryWithdraw",
      "docs": [
        "Withdraw unallocated funds from treasury"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasurer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "destinationAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTreasuryToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idlFileVersion",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "stream",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "treasurerAddress",
            "type": "publicKey"
          },
          {
            "name": "rateAmountUnits",
            "type": "u64"
          },
          {
            "name": "rateIntervalInSeconds",
            "type": "u64"
          },
          {
            "name": "startUtc",
            "docs": [
              "The start timestamp in seconds"
            ],
            "type": "u64"
          },
          {
            "name": "cliffVestAmountUnits",
            "docs": [
              "The amount availaible to withdraw inmidiately (without streaming)",
              "once the money stream starts.",
              "If both 'cliff_vest_amount_units' and 'cliff_vest_percent' are provided, the former will be used."
            ],
            "type": "u64"
          },
          {
            "name": "cliffVestPercent",
            "docs": [
              "The percent of the allocation assigned that is availaible to withdraw",
              "inmidiately (without streaming) once the money stream starts.",
              "If both 'cliff_vest_amount_units' and 'cliff_vest_percent' are provided, the second (this field) will be used."
            ],
            "type": "u64"
          },
          {
            "name": "beneficiaryAddress",
            "type": "publicKey"
          },
          {
            "name": "beneficiaryAssociatedToken",
            "type": "publicKey"
          },
          {
            "name": "treasuryAddress",
            "type": "publicKey"
          },
          {
            "name": "allocationAssignedUnits",
            "docs": [
              "Amount of tokens allocated to the stream on creation or top up. If the",
              "treasurer decides to close the stream, the vested amount will be sent",
              "to the benefifiary and the unvested amount will be sent to the",
              "treasurer",
              "",
              "The allocation assigned will be affected by the following instructions:",
              "`addFunds`"
            ],
            "type": "u64"
          },
          {
            "name": "allocationReservedUnits",
            "docs": [
              "Amount of tokens reserved to the stream. If the treasurer decides to",
              "close the stream, the total amount (vested and unvested) WILL be sent",
              "to the beneficiary",
              "",
              "[deprecated] The allocation reserved will be affected by the following instructions:",
              "`addFunds`"
            ],
            "type": "u64"
          },
          {
            "name": "totalWithdrawalsUnits",
            "docs": [
              "Withdrawal tracking",
              "The total amount that has been withdrawn by the beneficiary"
            ],
            "type": "u64"
          },
          {
            "name": "lastWithdrawalUnits",
            "docs": [
              "The last amount withdrew by the beneficiary"
            ],
            "type": "u64"
          },
          {
            "name": "lastWithdrawalSlot",
            "docs": [
              "The slot number when the last withdrawal was executed"
            ],
            "type": "u64"
          },
          {
            "name": "lastWithdrawalBlockTime",
            "docs": [
              "The blocktime value when the last withdrawal was executed"
            ],
            "type": "u64"
          },
          {
            "name": "lastManualStopWithdrawableUnitsSnap",
            "docs": [
              "How can a stream STOP? -> There are 2 ways:",
              "1) by a Manual Action (recordable when it happens) or",
              "2) by Running Out Of Funds (not recordable when it happens, needs to be calculated)"
            ],
            "type": "u64"
          },
          {
            "name": "lastManualStopSlot",
            "type": "u64"
          },
          {
            "name": "lastManualStopBlockTime",
            "type": "u64"
          },
          {
            "name": "lastManualResumeRemainingAllocationUnitsSnap",
            "docs": [
              "The remaining allocation units at the moment of the last manual resume",
              "must be set when calling the Resume Stream"
            ],
            "type": "u64"
          },
          {
            "name": "lastManualResumeSlot",
            "type": "u64"
          },
          {
            "name": "lastManualResumeBlockTime",
            "type": "u64"
          },
          {
            "name": "lastKnownTotalSecondsInPausedStatus",
            "docs": [
              "The total seconds that have been paused since the start_utc",
              "increment when resume is called manually"
            ],
            "type": "u64"
          },
          {
            "name": "lastAutoStopBlockTime",
            "docs": [
              "The last blocktime when the stream was stopped",
              "either manually or automaticaly (run out of funds)"
            ],
            "type": "u64"
          },
          {
            "name": "feePayedByTreasurer",
            "type": "bool"
          },
          {
            "name": "startUtcInSeconds",
            "docs": [
              "The start timestamp blocktime"
            ],
            "type": "u64"
          },
          {
            "name": "createdOnUtc",
            "docs": [
              "Unix timestamp (in seconds) when the stream was created"
            ],
            "type": "u64"
          },
          {
            "name": "category",
            "docs": [
              "Indicates the main product category such as `Vesting(1)`",
              "The default value is set to a `Default(0)` cateogry."
            ],
            "type": "u8"
          },
          {
            "name": "subCategory",
            "docs": [
              "Indicates the sub product category such as `Advisor(1)`, Development(2)",
              "The default value is set to a `Default(0)` sub_cateogry."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "streamTemplate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "startUtcInSeconds",
            "docs": [
              "The start timestamp blocktime"
            ],
            "type": "u64"
          },
          {
            "name": "cliffVestPercent",
            "docs": [
              "The percentage availaible to withdraw inmidiately (without streaming)",
              "once the money stream starts."
            ],
            "type": "u64"
          },
          {
            "name": "rateIntervalInSeconds",
            "type": "u64"
          },
          {
            "name": "durationNumberOfUnits",
            "type": "u64"
          },
          {
            "name": "feePayedByTreasurer",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "slot",
            "type": "u64"
          },
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "treasurerAddress",
            "type": "publicKey"
          },
          {
            "name": "associatedTokenAddress",
            "type": "publicKey"
          },
          {
            "name": "mintAddress",
            "docs": [
              "[deprecated] The address of the Mint of the treasury pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "labels",
            "docs": [
              "This field should not be used in its current form because it has a dynamic size",
              "",
              "The 4-bytes header can be repurposed in the future"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "lastKnownBalanceUnits",
            "docs": [
              "Treasury balance tracking",
              "The last known treasury balance (will be updated in the `refreshTreasuryData` instruction)"
            ],
            "type": "u64"
          },
          {
            "name": "lastKnownBalanceSlot",
            "docs": [
              "The slot of the last time the treasury balance was updated"
            ],
            "type": "u64"
          },
          {
            "name": "lastKnownBalanceBlockTime",
            "docs": [
              "The blocktime when the treasury balance was updated"
            ],
            "type": "u64"
          },
          {
            "name": "allocationAssignedUnits",
            "docs": [
              "Treasury allocation tracking",
              "The allocation assigned accross all the streams that belong to this treasury",
              "",
              "The allocation assined will be modified in the following instructions:",
              "`createStream`, `allocate`, `withdraw` and `closeStream`"
            ],
            "type": "u64"
          },
          {
            "name": "allocationReservedUnits",
            "docs": [
              "The allocation reserved accross all the streams that belong to this treasury",
              "",
              "[deprecated] The allocation reserved will be modified in the following instructions:",
              "`createStream`, `withdraw` and `closeStream`"
            ],
            "type": "u64"
          },
          {
            "name": "totalWithdrawalsUnits",
            "docs": [
              "The total amount withdrawn by all the streams that belong to this treasury"
            ],
            "type": "u64"
          },
          {
            "name": "totalStreams",
            "docs": [
              "The current amount of streams in the treasury (will be updated in the `refreshTreasuryData` instruction)"
            ],
            "type": "u64"
          },
          {
            "name": "createdOnUtc",
            "type": "u64"
          },
          {
            "name": "treasuryType",
            "docs": [
              "The type of the treasury (Open, Locked)"
            ],
            "type": "u8"
          },
          {
            "name": "autoClose",
            "docs": [
              "only used for filtering in the ui"
            ],
            "type": "bool"
          },
          {
            "name": "solFeePayedByTreasury",
            "docs": [
              "Indicates whether program sol fees are payed from the `treasury`'s",
              "lamports balance (when true) or by the `payer` account in the",
              "transaction (when false)"
            ],
            "type": "bool"
          },
          {
            "name": "category",
            "docs": [
              "Indicates the main product category such as `Vesting(1)`",
              "The default value is set to a `Default(0)` cateogry."
            ],
            "type": "u8"
          },
          {
            "name": "subCategory",
            "docs": [
              "Indicates the sub product category such as `Advisor(1)`, Development(2)",
              "The default value is set to a `Default(0)` sub_cateogry."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Category",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Default"
          },
          {
            "name": "Vesting"
          }
        ]
      }
    },
    {
      "name": "SubCategory",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Default"
          },
          {
            "name": "Advisor"
          },
          {
            "name": "Development"
          },
          {
            "name": "Foundation"
          },
          {
            "name": "Investor"
          },
          {
            "name": "Marketing"
          },
          {
            "name": "Partnership"
          },
          {
            "name": "Seed"
          },
          {
            "name": "Team"
          },
          {
            "name": "Community"
          }
        ]
      }
    },
    {
      "name": "StreamStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Scheduled"
          },
          {
            "name": "Running"
          },
          {
            "name": "Paused"
          }
        ]
      }
    },
    {
      "name": "TreasuryType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Opened"
          },
          {
            "name": "Locked"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "StreamEvent",
      "fields": [
        {
          "name": "version",
          "type": "u8",
          "index": false
        },
        {
          "name": "initialized",
          "type": "bool",
          "index": false
        },
        {
          "name": "name",
          "type": "string",
          "index": false
        },
        {
          "name": "treasurerAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rateAmountUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "rateIntervalInSeconds",
          "type": "u64",
          "index": false
        },
        {
          "name": "startUtc",
          "type": "u64",
          "index": false
        },
        {
          "name": "cliffVestAmountUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "cliffVestPercent",
          "type": "u64",
          "index": false
        },
        {
          "name": "beneficiaryAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "beneficiaryAssociatedToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "treasuryAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "allocationAssignedUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "allocationReservedUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalWithdrawalsUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastWithdrawalUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastWithdrawalSlot",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastWithdrawalBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualStopWithdrawableUnitsSnap",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualStopSlot",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualResumeRemainingAllocationUnitsSnap",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualResumeSlot",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastManualResumeBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastKnownTotalSecondsInPausedStatus",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastAutoStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "feePayedByTreasurer",
          "type": "bool",
          "index": false
        },
        {
          "name": "status",
          "type": "string",
          "index": false
        },
        {
          "name": "isManualPause",
          "type": "bool",
          "index": false
        },
        {
          "name": "cliffUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "currentBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "secondsSinceStart",
          "type": "u64",
          "index": false
        },
        {
          "name": "estDepletionTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "fundsLeftInStream",
          "type": "u64",
          "index": false
        },
        {
          "name": "fundsSentToBeneficiary",
          "type": "u64",
          "index": false
        },
        {
          "name": "withdrawableUnitsWhilePaused",
          "type": "u64",
          "index": false
        },
        {
          "name": "nonStopEarningUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "missedUnitsWhilePaused",
          "type": "u64",
          "index": false
        },
        {
          "name": "entitledEarningsUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "withdrawableUnitsWhileRunning",
          "type": "u64",
          "index": false
        },
        {
          "name": "beneficiaryRemainingAllocation",
          "type": "u64",
          "index": false
        },
        {
          "name": "beneficiaryWithdrawableAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "lastKnownStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "createdOnUtc",
          "type": "u64",
          "index": false
        },
        {
          "name": "category",
          "type": "u8",
          "index": false
        },
        {
          "name": "subCategory",
          "type": "u8",
          "index": false
        }
      ]
    },
    {
      "name": "CreateTreasuryEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "solDepositedForFees",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryType",
          "type": "u8",
          "index": false
        },
        {
          "name": "treasuryIsAutoClose",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CreateStreamEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamStartTs",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamRateAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamRateInterval",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamAllocation",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamCliff",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamWithdrawEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToBeneficiary",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamWithdrawableBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsManuallyPaused",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalWithdrawalsAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryTotalWithdrawalsAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamPauseEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamLastManualStopWithdrawableAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamResumeEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalSecondsInPausedStatusAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "TreasuryRefreshEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamTransferEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "previousBeneficiary",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newBeneficiary",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "TreasuryAddFundsEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "StreamAllocateEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamStatusBefore",
          "type": "u32",
          "index": false
        },
        {
          "name": "streamWasManuallyPausedBefore",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamLastAutoStopBlockTime",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalSecondsInPausedStatusAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CloseStreamEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToBeneficiary",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamIsTokenWithdrawFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "streamAllocationBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "streamTotalWithdrawalsBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryAllocationAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryTotalStreamsAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "stream",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CloseTreasuryEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToDestination",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "TreasuryWithdrawEvent",
      "fields": [
        {
          "name": "timestamp",
          "type": "u64",
          "index": false
        },
        {
          "name": "solFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenFeeCharged",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmountSentToDestination",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasuryIsSolFeePayedByTreasury",
          "type": "bool",
          "index": false
        },
        {
          "name": "treasuryBalanceAfter",
          "type": "u64",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": true
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidProgramId",
      "msg": "Invalid Money Streaming Program ID"
    },
    {
      "code": 6001,
      "name": "InvalidOwner",
      "msg": "Invalid account owner"
    },
    {
      "code": 6002,
      "name": "NotAuthorized",
      "msg": "Not Authorized"
    },
    {
      "code": 6003,
      "name": "Overflow",
      "msg": "Overflow"
    },
    {
      "code": 6004,
      "name": "InvalidAssociatedToken",
      "msg": "Invalid associated token address"
    },
    {
      "code": 6005,
      "name": "InvalidFeeTreasuryAccount",
      "msg": "Invalid fee treasury account"
    },
    {
      "code": 6006,
      "name": "InvalidTreasuryMintDecimals",
      "msg": "Invalid treasury mint decimals"
    },
    {
      "code": 6007,
      "name": "TreasuryAlreadyInitialized",
      "msg": "Treasury is already initialized"
    },
    {
      "code": 6008,
      "name": "TreasuryNotInitialized",
      "msg": "Treasury is not initialized"
    },
    {
      "code": 6009,
      "name": "InvalidTreasuryVersion",
      "msg": "Invalid treasury version"
    },
    {
      "code": 6010,
      "name": "InvalidTreasuryMint",
      "msg": "Invalid treasury mint address"
    },
    {
      "code": 6011,
      "name": "InvalidTreasury",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6012,
      "name": "InvalidTreasurySize",
      "msg": "Invalid treasury size"
    },
    {
      "code": 6013,
      "name": "InvalidTreasurer",
      "msg": "Invalid treasurer"
    },
    {
      "code": 6014,
      "name": "InvalidBeneficiary",
      "msg": "Invalid beneficiary"
    },
    {
      "code": 6015,
      "name": "InvalidArgument",
      "msg": "Invalid argument"
    },
    {
      "code": 6016,
      "name": "StreamNotInitialized",
      "msg": "Stream not initialized"
    },
    {
      "code": 6017,
      "name": "StreamAlreadyInitialized",
      "msg": "Stream is already initialized"
    },
    {
      "code": 6018,
      "name": "InvalidStreamVersion",
      "msg": "Invalid stream version"
    },
    {
      "code": 6019,
      "name": "InvalidStreamSize",
      "msg": "Invalid stream size"
    },
    {
      "code": 6020,
      "name": "InvalidStream",
      "msg": "Invalid stream account"
    },
    {
      "code": 6021,
      "name": "InvalidRequestedStreamAllocation",
      "msg": "Invalid requested stream allocation"
    },
    {
      "code": 6022,
      "name": "InvalidWithdrawalAmount",
      "msg": "Invalid withdrawal amount"
    },
    {
      "code": 6023,
      "name": "StringTooLong",
      "msg": "The string length is larger than 32 bytes"
    },
    {
      "code": 6024,
      "name": "StreamAlreadyRunning",
      "msg": "The stream is already running"
    },
    {
      "code": 6025,
      "name": "StreamAlreadyPaused",
      "msg": "The stream is already paused"
    },
    {
      "code": 6026,
      "name": "StreamZeroRemainingAllocation",
      "msg": "Stream allocation assigned is zero"
    },
    {
      "code": 6027,
      "name": "ZeroContributionAmount",
      "msg": "Contribution amount is zero"
    },
    {
      "code": 6028,
      "name": "ZeroWithdrawalAmount",
      "msg": "Withdrawal amount is zero"
    },
    {
      "code": 6029,
      "name": "StreamIsScheduled",
      "msg": "Stream has not started"
    },
    {
      "code": 6030,
      "name": "CloseLockedStreamNotAllowedWhileRunning",
      "msg": "Streams in a Locked treasury can not be closed while running"
    },
    {
      "code": 6031,
      "name": "PauseOrResumeLockedStreamNotAllowed",
      "msg": "Streams in a Locked treasury can not be paused or resumed"
    },
    {
      "code": 6032,
      "name": "ReservedAllocationExceedWithdrawableAmount",
      "msg": "Can not pause a stream if the reserved allocation is greater than the withdrawable amount"
    },
    {
      "code": 6033,
      "name": "AllocateNotAllowedOnLockedStreams",
      "msg": "Can not allocate funds to a stream from a locked treasury"
    },
    {
      "code": 6034,
      "name": "InvalidStreamRate",
      "msg": "Invalid stream rate"
    },
    {
      "code": 6035,
      "name": "InvalidCliff",
      "msg": "Invalid cliff"
    },
    {
      "code": 6036,
      "name": "InsufficientLamports",
      "msg": "Insufficient lamports"
    },
    {
      "code": 6037,
      "name": "TreasuryContainsStreams",
      "msg": "This treasury contains one or more streams"
    },
    {
      "code": 6038,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6039,
      "name": "InsufficientTreasuryBalance",
      "msg": "Insufficient treasury balance"
    },
    {
      "code": 6040,
      "name": "CannotResumeAutoPausedStream",
      "msg": "Stream is auto-paused. To resume use allocate"
    },
    {
      "code": 6041,
      "name": "CannotPauseAndUnpauseOnSameBlockTime",
      "msg": "Cannot pause and unpause on the same block time"
    },
    {
      "code": 6042,
      "name": "InvalidTreasuryRequestedAllocation",
      "msg": "Treasury allocation can not be greater than treasury balance"
    },
    {
      "code": 6043,
      "name": "InvalidIdlFileVersion",
      "msg": "Invalid IDL file version"
    },
    {
      "code": 6044,
      "name": "InvalidTotalStreamsInTreasury",
      "msg": "Invalid total streams in treasury"
    },
    {
      "code": 6045,
      "name": "InvalidTemplateVersion",
      "msg": "Invalid template version"
    },
    {
      "code": 6046,
      "name": "InvalidTemplateSize",
      "msg": "Invalid template size"
    },
    {
      "code": 6047,
      "name": "CannotModifyTemplate",
      "msg": "Template cannot be modified after streams have been created"
    }
  ]
};
