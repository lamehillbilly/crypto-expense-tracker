"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
var prisma = new client_1.PrismaClient();
function readJsonFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf-8')];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, JSON.parse(data)];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error reading ".concat(filePath, ":"), error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function migrateData() {
    return __awaiter(this, void 0, void 0, function () {
        var entriesData_1, tradesData_1, error_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 7]);
                    return [4 /*yield*/, readJsonFile(path_1.default.join(process.cwd(), 'data', 'entries.json'))];
                case 1:
                    entriesData_1 = _a.sent();
                    return [4 /*yield*/, readJsonFile(path_1.default.join(process.cwd(), 'data', 'trades.json'))];
                case 2:
                    tradesData_1 = _a.sent();
                    if (!entriesData_1 && !tradesData_1) {
                        console.log('No data files found to migrate.');
                        return [2 /*return*/];
                    }
                    // Begin transaction
                    return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var _i, entriesData_2, entry, _a, tradesData_2, trade;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: 
                                    // Clear existing data (optional - remove if you want to keep existing DB data)
                                    return [4 /*yield*/, tx.entry.deleteMany({})];
                                    case 1:
                                        // Clear existing data (optional - remove if you want to keep existing DB data)
                                        _b.sent();
                                        return [4 /*yield*/, tx.trade.deleteMany({})];
                                    case 2:
                                        _b.sent();
                                        if (!entriesData_1) return [3 /*break*/, 6];
                                        _i = 0, entriesData_2 = entriesData_1;
                                        _b.label = 3;
                                    case 3:
                                        if (!(_i < entriesData_2.length)) return [3 /*break*/, 6];
                                        entry = entriesData_2[_i];
                                        return [4 /*yield*/, tx.entry.create({
                                                data: {
                                                    type: entry.type,
                                                    amount: entry.amount,
                                                    date: new Date(entry.date),
                                                    txn: entry.txn || null,
                                                    tokenName: entry.tokenName || null,
                                                    pnl: entry.pnl || null,
                                                    daysHeld: entry.daysHeld || null,
                                                    expenseDetails: entry.expenseDetails || null,
                                                    claimDetails: entry.claimDetails || null
                                                }
                                            })];
                                    case 4:
                                        _b.sent();
                                        console.log("Migrated entry: ".concat(entry.type, " - ").concat(entry.date));
                                        _b.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 3];
                                    case 6:
                                        if (!tradesData_1) return [3 /*break*/, 10];
                                        _a = 0, tradesData_2 = tradesData_1;
                                        _b.label = 7;
                                    case 7:
                                        if (!(_a < tradesData_2.length)) return [3 /*break*/, 10];
                                        trade = tradesData_2[_a];
                                        return [4 /*yield*/, tx.trade.create({
                                                data: {
                                                    tokenName: trade.tokenName,
                                                    purchaseAmount: trade.purchaseAmount,
                                                    purchaseDate: new Date(trade.purchaseDate),
                                                    status: trade.status,
                                                    closeAmount: trade.closeAmount || null,
                                                    closeDate: trade.closeDate ? new Date(trade.closeDate) : null,
                                                    pnl: trade.pnl || null
                                                }
                                            })];
                                    case 8:
                                        _b.sent();
                                        console.log("Migrated trade: ".concat(trade.tokenName));
                                        _b.label = 9;
                                    case 9:
                                        _a++;
                                        return [3 /*break*/, 7];
                                    case 10: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    // Begin transaction
                    _a.sent();
                    console.log('Migration completed successfully!');
                    return [3 /*break*/, 7];
                case 4:
                    error_2 = _a.sent();
                    console.error('Migration failed:', error_2);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, prisma.$disconnect()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Run the migration
migrateData();
