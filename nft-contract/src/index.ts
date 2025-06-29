// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Export the main contract that's currently being used
export * as CombinedContract from "./managed/combinedContract/contract/index.cjs";
export * from "./witnesses.js";

// Note: Counter and ProtocolWalletBase exports are commented out until needed
// export * as Counter from "./managed/counter/contract/index.cjs";
// export * as ProtocolWalletBase from "./managed/protocol_wallet_base/contract/index.cjs";
