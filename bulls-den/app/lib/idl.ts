export const IDL = {
  "address": "Bu11sDen11111111111111111111111111111111111",
  "metadata": {
    "name": "bulls_den",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "$ANSEM-only moderated prediction market on Solana"
  },
  "instructions": [
    {
      "name": "initialize_config",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "ansem_mint"
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "create_market",
      "discriminator": [
        103,
        226,
        97,
        235,
        200,
        188,
        251,
        254
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "ansem_mint"
        },
        {
          "name": "creator"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "market_id",
          "type": "u64"
        },
        {
          "name": "outcome_a",
          "type": "string"
        },
        {
          "name": "outcome_b",
          "type": "string"
        },
        {
          "name": "deadline",
          "type": "i64"
        }
      ]
    },
    {
      "name": "buy_shares",
      "discriminator": [
        40,
        239,
        138,
        154,
        8,
        37,
        106,
        108
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": "u8"
        }
      ]
    },
    {
      "name": "resolve_market",
      "discriminator": [
        155,
        23,
        80,
        173,
        46,
        74,
        23,
        239
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "treasury_token_account",
          "writable": true
        },
        {
          "name": "creator_token_account",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "winning_outcome",
          "type": "u8"
        }
      ]
    },
    {
      "name": "claim_winnings",
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "Market",
      "discriminator": [
        219,
        190,
        213,
        55,
        0,
        227,
        198,
        154
      ]
    },
    {
      "name": "UserPosition",
      "discriminator": [
        251,
        248,
        209,
        245,
        83,
        234,
        17,
        27
      ]
    }
  ],
  "events": [
    {
      "name": "BuyEvent",
      "discriminator": [
        103,
        244,
        82,
        31,
        44,
        245,
        119,
        119
      ]
    },
    {
      "name": "ResolveEvent",
      "discriminator": [
        11,
        133,
        150,
        70,
        188,
        29,
        100,
        64
      ]
    },
    {
      "name": "ClaimEvent",
      "discriminator": [
        93,
        15,
        70,
        170,
        48,
        140,
        212,
        219
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "StringTooLong",
      "msg": "String too long"
    },
    {
      "code": 6001,
      "name": "InvalidDeadline",
      "msg": "Invalid deadline"
    },
    {
      "code": 6002,
      "name": "DeadlineTooFar",
      "msg": "Deadline more than 14 days away"
    },
    {
      "code": 6003,
      "name": "ZeroAmount",
      "msg": "Amount must be > 0"
    },
    {
      "code": 6004,
      "name": "InvalidOutcome",
      "msg": "Invalid outcome (must be 0 or 1)"
    },
    {
      "code": 6005,
      "name": "MarketNotOpen",
      "msg": "Market is not open"
    },
    {
      "code": 6006,
      "name": "MarketExpired",
      "msg": "Market has expired"
    },
    {
      "code": 6007,
      "name": "TooEarlyToResolve",
      "msg": "Too early to resolve"
    },
    {
      "code": 6008,
      "name": "EmptyVault",
      "msg": "Vault is empty"
    },
    {
      "code": 6009,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6010,
      "name": "MarketNotResolved",
      "msg": "Market is not resolved"
    },
    {
      "code": 6011,
      "name": "NoWinningOutcome",
      "msg": "No winning outcome set"
    },
    {
      "code": 6012,
      "name": "AlreadyClaimed",
      "msg": "Already claimed"
    },
    {
      "code": 6013,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6014,
      "name": "NoWinningShares",
      "msg": "No winning shares"
    },
    {
      "code": 6015,
      "name": "ZeroClaim",
      "msg": "Claim amount is zero"
    }
  ],
  "types": [
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "ansem_mint",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "paused",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "Market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market_id",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "outcome_a",
            "type": "string"
          },
          {
            "name": "outcome_b",
            "type": "string"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "total_a",
            "type": "u64"
          },
          {
            "name": "total_b",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "MarketStatus"
              }
            }
          },
          {
            "name": "winning_outcome",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "winners_pool",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vault_bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "market_id",
            "type": "u64"
          },
          {
            "name": "shares_a",
            "type": "u64"
          },
          {
            "name": "shares_b",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MarketStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Open"
          },
          {
            "name": "Resolved"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    },
    {
      "name": "BuyEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market_id",
            "type": "u64"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "outcome",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ResolveEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market_id",
            "type": "u64"
          },
          {
            "name": "winning_outcome",
            "type": "u8"
          },
          {
            "name": "total",
            "type": "u64"
          },
          {
            "name": "treasury_amount",
            "type": "u64"
          },
          {
            "name": "creator_amount",
            "type": "u64"
          },
          {
            "name": "winners_pool",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ClaimEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market_id",
            "type": "u64"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
} as const;

export type BullsDen = typeof IDL;
