# User Module

This module provides utilities for determining information about users.

## Commands

None

## Exports

### isIdentifiedAs(nickname: string, accountname: string): Promise<boolean>

Determines whether the user at the specified nickname is identified to
the given account name.

This is true if one of the following is true:

1. The user is identified and the nickname they are using is registered to them.
2. The user is identified and the accountname is their accountname.

## Module Hooks

None