// https://gist.github.com/willium/15e61146761c69c7eb50d01dbe005852

declare module "@uwdata/mosaic-core" {
	import type { Query } from "@uwdata/mosaic-sql";
	import {
		type AsyncDuckDB,
		type AsyncDuckDBConnection,
	} from "@duckdb/duckdb-wasm";

	// Arrow Utilities
	export declare function isArrowTable(
		values: unknown,
	): values is { getChild: () => unknown };

	export declare function convertArrowArrayType(type: {
		typeId: number;
	}): Float64ArrayConstructor | ArrayConstructor;

	export declare function convertArrowValue(type: {
		typeId: number;
		bitWidth?: number;
		scale?: number;
	}): (v: unknown) => unknown;

	export declare function convertArrowColumn(column: {
		type: { typeId: number; bitWidth?: number; scale?: number };
		length: number;
		get: (row: number) => unknown;
		toArray: () => unknown[];
	}): unknown[];

	// Type Utilities
	export declare function jsType(
		type: string,
	): "number" | "date" | "boolean" | "string" | "array" | "object";

	// Coordinator
	export function coordinator(instance?: Coordinator): Coordinator;

	export class Coordinator {
		constructor(db?: WasmConnector, options?: CoordinatorOptions);
		logger(logger?: Logger): Logger;
		configure(options?: ConfigureOptions): void;
		clear(options?: ClearOptions): void;
		databaseConnector(db?: WasmConnector): WasmConnector;
		cancel(requests: unknown[]): void;
		exec(query: string | string[], options?: ExecOptions): Promise<unknown>;
		query(query: unknown, options?: QueryOptions): Promise<unknown>;
		prefetch(query: unknown, options?: QueryOptions): Promise<unknown>;
		createBundle(
			name: string,
			queries: unknown[],
			priority?: Priority,
		): Promise<unknown>;
		loadBundle(name: string, priority?: Priority): Promise<unknown>;
		updateClient(
			client: MosaicClient,
			query: unknown,
			priority?: Priority,
		): Promise<void>;
		requestQuery(client: MosaicClient, query?: unknown): Promise<void>;
		connect(client: MosaicClient): Promise<void>;
		disconnect(client: MosaicClient): void;
	}

	export interface CoordinatorOptions {
		logger?: Logger;
		manager?: QueryManager;
	}

	export interface ConfigureOptions {
		cache?: boolean;
		consolidate?: boolean;
		indexes?: boolean | object;
	}

	export interface ClearOptions {
		clients?: boolean;
		cache?: boolean;
	}

	export interface ExecOptions {
		priority?: Priority;
	}

	export interface QueryOptions {
		type?: string;
		cache?: boolean;
		priority?: Priority;
		[key: string]: unknown;
	}

	// Logger
	export interface Logger {
		debug(...args: unknown[]): void;
		error(...args: unknown[]): void;
	}

	export function socketConnector(uri = 'ws://localhost:3000/')

	// WASM Connector
	export function wasmConnector(
		options?: WasmConnectorOptions,
	): WasmConnector;

	export interface WasmConnectorOptions {
		duckdb?: AsyncDuckDB;
		connection?: AsyncDuckDBConnection;
		log?: boolean;
	}

	export interface WasmConnector {
		getDuckDB(): Promise<AsyncDuckDB>;
		getConnection(): Promise<AsyncDuckDBConnection>;
		query(query: WasmQuery): Promise<unknown>;
	}

	export interface WasmQuery {
		type?: "exec" | "arrow" | "json";
		sql: string;
	}

	// Filter Group
	export class FilterGroup {
		constructor(
			coordinator: Coordinator,
			selection: Selection,
			index?: boolean | object,
		);
		finalize(): void;
		reset(): void;
		add(client: MosaicClient): FilterGroup;
		remove(client: MosaicClient): FilterGroup;
		update(): Promise<unknown>;
	}

	// Mosaic Client
	export class MosaicClient {
		constructor(filterSelection?: Selection);
		get coordinator(): Coordinator | null;
		set coordinator(coordinator: Coordinator | null);
		get filterBy(): Selection;
		get filterIndexable(): boolean;
		fields(): Field[] | null;
		fieldInfo(info: FieldInfo[]): this;
		query(filter?: unknown[]): Query | null;
		queryPending(): this;
		queryResult(data: unknown): this;
		queryError(error: unknown): this;
		requestQuery(query?: unknown): Promise<unknown>;
		requestUpdate(): void;
		update(): this | Promise<unknown>;
	}

	// Priority Enum
	export enum Priority {
		High = 0,
		Normal = 1,
		Low = 2,
	}

	// Query Manager
	export function QueryManager(): QueryManager;

	export interface QueryManager {
		cache(value?: boolean | object): unknown;
		logger(value?: Logger): Logger;
		connector(connector?: WasmConnector): WasmConnector;
		consolidate(flag: boolean): void;
		request(request: unknown, priority?: Priority): Promise<unknown>;
		cancel(requests: unknown[]): void;
		clear(): void;
		record(): Recorder;
	}

	export interface Recorder {
		add(query: string): void;
		reset(): void;
		snapshot(): string[];
		stop(): string[];
	}

	// Field Info
	export const Count: "count";
	export const Nulls: "nulls";
	export const Max: "max";
	export const Min: "min";
	export const Distinct: "distinct";
	export const Stats: {
		Count: typeof Count;
		Nulls: typeof Nulls;
		Max: typeof Max;
		Min: typeof Min;
		Distinct: typeof Distinct;
	};


	export interface Field {
		table: string;
		column: string;
		stats?: Set<keyof typeof Stats> | (keyof typeof Stats)[];
	}

	export interface FieldInfo {
		table: string;
		column: string;
		sqlType: string;
		type: string;
		nullable: boolean;
		[key: string]: unknown;
	}

	// Event Handling
	type CallbackFunction = (value: unknown) => Promise<unknown> | undefined;

	type EventEntry = {
		callbacks: Set<CallbackFunction>;
		pending: Promise<unknown> | null;
		queue: DispatchQueue;
	};

	type EventMap = Map<string, EventEntry>;

	type EventValue = unknown;

	type EventFilter = (value: unknown) => boolean | null;

	type EventEmitter = (type: string, value: unknown) => void;

	type EventDispatcher = {
		_callbacks: EventMap;
		addEventListener: (type: string, callback: CallbackFunction) => void;
		removeEventListener: (type: string, callback: CallbackFunction) => void;
		willEmit: (type: string, value: unknown) => EventValue;
		emitQueueFilter: (value: unknown) => EventFilter;
		cancel: (type: string) => void;
		emit: EventEmitter;
	};

	type QueueNode = {
		value: unknown;
		next: QueueNode | null;
	};

	type DispatchQueue = {
		next: QueueNode | null;
		clear: () => void;
		isEmpty: () => boolean;
		enqueue: (value: unknown, filter?: EventFilter) => void;
		dequeue: () => unknown;
	};

	// Param and Selection
	class Param extends AsyncDispatch {
		private _value: unknown;

		constructor(value: unknown);

		static value(value: unknown): Param;

		static array(values: unknown[]): Param;

		get value(): unknown;

		update(value: unknown, options?: { force?: boolean }): this;

		willEmit(type: string, value: unknown): unknown;
	}

	class Selection extends Param {
		private _resolved: unknown;
		private _resolver: SelectionResolver;

		constructor(resolver?: SelectionResolver);

		static intersect(options?: { cross?: boolean }): Selection;

		static union(options?: { cross?: boolean }): Selection;

		static single(options?: { cross?: boolean }): Selection;

		static crossfilter(): Selection;

		clone(): this;

		remove(source: unknown): this;

		get active(): unknown;

		get value(): unknown;

		get clauses(): unknown;

		willEmit(type: string, value: unknown): unknown;

		emitQueueFilter(type: string, value: unknown): unknown;

		skip(client: unknown, clause: unknown): boolean;

		predicate(client: unknown, noSkip?: boolean): unknown;
	}
}

declare module "@uwdata/mosaic-sql" {
	
	export function queryFieldInfo(
		mc: Coordinator,
		fields: Field[],
	): Promise<FieldInfo[]>;

	// Ref class
	export class Ref {
		table?: string;
		column?: string;

		constructor(table?: string | Ref | null, column?: string | null);

		get columns(): string[];

		toString(): string;
	}

	// Reference utilities
	export function quoteTableName(table: string): string;

	export function isColumnRefFor(ref: unknown, name: string): boolean;

	export function asColumn(value: unknown): unknown;

	export function asRelation(value: unknown): unknown;

	export function relation(name: string): Ref;

	export function column(table: string | null, column: string): Ref;
	export function column(column: string): Ref;

	export function all(table: string): Ref;

	// Query class
	export class Query {
		query: {
			with: Array<{ as: string; query: Query }>;
			select: Array<{ as: string; expr: unknown }>;
			from: Array<{ as?: string; from: unknown }>;
			where: unknown[];
			groupby: unknown[];
			having: unknown[];
			window: Array<{ as: string; expr: unknown }>;
			qualify: unknown[];
			orderby: unknown[];
			distinct?: boolean;
			sample?: {
				rows?: number;
				perc?: number;
				method?: string;
				seed?: number;
			};
			limit?: number;
			offset?: number;
		};
		cteFor?: Query;
		describe?: boolean;

		static select(...expr: unknown[]): Query;
		static from(...expr: unknown[]): Query;
		static with(...expr: unknown[]): Query;
		static union(...queries: Query[]): SetOperation;
		static unionAll(...queries: Query[]): SetOperation;
		static intersect(...queries: Query[]): SetOperation;
		static except(...queries: Query[]): SetOperation;
		static describe(query: Query): Query;

		constructor();
		clone(): Query;
		with(...expr: unknown[]): this;
		select(...expr: unknown[]): this;
		$select(...expr: unknown[]): this;
		distinct(value?: boolean): this;
		from(...expr: unknown[]): this;
		$from(...expr: unknown[]): this;
		sample(
			value?: number | { rows?: number; perc?: number; method?: string },
			method?: string,
		): this;
		where(...expr: unknown[]): this;
		$where(...expr: unknown[]): this;
		groupby(...expr: unknown[]): this;
		$groupby(...expr: unknown[]): this;
		having(...expr: unknown[]): this;
		window(...expr: unknown[]): this;
		qualify(...expr: unknown[]): this;
		orderby(...expr: unknown[]): this;
		limit(value?: number): this;
		offset(value?: number): this;
		get subqueries(): Query[];
		toString(): string;
	}

	// SetOperation class
	export class SetOperation {
		op: string;
		queries: Query[];
		query: { orderby: unknown[] };

		constructor(op: string, queries: Query[]);
		clone(): SetOperation;
		orderby(...expr: unknown[]): this | unknown[];
		limit(value?: number): this | number | undefined;
		offset(value?: number): this | number | undefined;
		get subqueries(): Query[];
		toString(): string;
	}

	// Query utilities
	export function isQuery(value: unknown): value is Query | SetOperation;
	export function isDescribeQuery(value: unknown): value is Query;

	// Parameter utilities
	export function isParamLike(value: unknown): value is {
		addEventListener: (
			type: string,
			listener: EventListenerOrEventListenerObject,
			options?: boolean | AddEventListenerOptions,
		) => void;
	};

	// SQLExpression class and utilities
	export function isSQLExpression(value: unknown): value is SQLExpression;

	export class SQLExpression {
		private _expr: (string | SQLExpression | Ref)[];
		private _deps: string[];
		private _params?: unknown[];
		map?: Map<string, Set<(a: SQLExpression) => Promise<void> | void>>;

		constructor(
			parts: (string | SQLExpression | Ref)[],
			columns?: string[],
			props?: object,
		);

		get value(): this;

		get columns(): string[];

		get column(): string | undefined;

		annotate(...props: object[]): this;

		toString(): string;

		addEventListener(
			type: string,
			callback: (a: SQLExpression) => Promise<void> | void,
		): void;
	}

	export function parseSQL(
		strings: TemplateStringsArray,
		exprs: unknown[],
	): {
		spans: (string | unknown)[];
		cols: string[];
	};

	export function sql(
		strings: TemplateStringsArray,
		...exprs: unknown[]
	): SQLExpression;

	// SQL conversion utilities
	export function toSQL(value: unknown): string;

	export function literalToSQL(value: unknown): string;

	// New functions and constants
	export function create(
		name: string,
		query: string,
		options?: { replace?: boolean; temp?: boolean; view?: boolean },
	): string;

	export function loadExtension(name: string): string;

	export function load(
		method: string,
		tableName: string,
		fileName: string,
		options?: object,
		defaults?: object,
	): string;

	export function loadCSV(
		tableName: string,
		fileName: string,
		options?: object,
	): string;

	export function loadJSON(
		tableName: string,
		fileName: string,
		options?: object,
	): string;

	export function loadParquet(
		tableName: string,
		fileName: string,
		options?: object,
	): string;

	export function loadSpatial(
		tableName: string,
		fileName: string,
		options?: object,
	): string;

	export function loadObjects(
		tableName: string,
		data: unknown,
		options?: object,
	): string;

	export function sqlFrom(data: unknown, options?: object): string;

	export function agg(
		strings: TemplateStringsArray,
		...exprs: unknown[]
	): SQLExpression;

	export class AggregateFunction extends SQLExpression {
		constructor(
			op: string,
			args?: unknown[],
			type?: string,
			isDistinct?: boolean,
			filter?: unknown,
		);

		distinct(): AggregateFunction;

		where(filter: unknown): AggregateFunction;

		window(): WindowFunction;

		partitionby(...expr: unknown[]): WindowFunction;

		orderby(...expr: unknown[]): WindowFunction;

		rows(frame: unknown[]): WindowFunction;

		range(frame: unknown[]): WindowFunction;
	}

	// Aggregate function definitions
	export const count: (...args: unknown[]) => AggregateFunction;
	export const avg: (...args: unknown[]) => AggregateFunction;
	export const mean: (...args: unknown[]) => AggregateFunction;
	export const mad: (...args: unknown[]) => AggregateFunction;
	export const max: (...args: unknown[]) => AggregateFunction;
	export const min: (...args: unknown[]) => AggregateFunction;
	export const sum: (...args: unknown[]) => AggregateFunction;
	export const product: (...args: unknown[]) => AggregateFunction;
	export const median: (...args: unknown[]) => AggregateFunction;
	export const quantile: (...args: unknown[]) => AggregateFunction;
	export const mode: (...args: unknown[]) => AggregateFunction;

	// Statistical function definitions
	export const variance: (...args: unknown[]) => AggregateFunction;
	export const stddev: (...args: unknown[]) => AggregateFunction;
	export const skewness: (...args: unknown[]) => AggregateFunction;
	export const kurtosis: (...args: unknown[]) => AggregateFunction;
	export const entropy: (...args: unknown[]) => AggregateFunction;
	export const varPop: (...args: unknown[]) => AggregateFunction;
	export const stddevPop: (...args: unknown[]) => AggregateFunction;

	// Correlation functions
	export const corr: (...args: unknown[]) => AggregateFunction;
	export const covarPop: (...args: unknown[]) => AggregateFunction;
	export const regrIntercept: (...args: unknown[]) => AggregateFunction;
	export const regrSlope: (...args: unknown[]) => AggregateFunction;
	export const regrCount: (...args: unknown[]) => AggregateFunction;
	export const regrR2: (...args: unknown[]) => AggregateFunction;
	export const regrSYY: (...args: unknown[]) => AggregateFunction;
	export const regrSXX: (...args: unknown[]) => AggregateFunction;
	export const regrSXY: (...args: unknown[]) => AggregateFunction;
	export const regrAvgX: (...args: unknown[]) => AggregateFunction;
	export const regrAvgY: (...args: unknown[]) => AggregateFunction;

	// Additional aggregate functions
	export const first: (...args: unknown[]) => AggregateFunction;
	export const last: (...args: unknown[]) => AggregateFunction;

	export const argmin: (...args: unknown[]) => AggregateFunction;
	export const argmax: (...args: unknown[]) => AggregateFunction;

	export const stringAgg: (...args: unknown[]) => AggregateFunction;
	export const arrayAgg: (...args: unknown[]) => AggregateFunction;

	// Function call utility
	export function functionCall(
		op: string,
		type?: string,
	): (...values: unknown[]) => SQLExpression;

	// Specific function definitions
	export const regexp_matches: (...values: unknown[]) => SQLExpression;
	export const contains: (...values: unknown[]) => SQLExpression;
	export const prefix: (...values: unknown[]) => SQLExpression;
	export const suffix: (...values: unknown[]) => SQLExpression;
	export const lower: (...values: unknown[]) => SQLExpression;
	export const upper: (...values: unknown[]) => SQLExpression;
	export const length: (...values: unknown[]) => SQLExpression;
	export const isNaN: (...values: unknown[]) => SQLExpression;
	export const isFinite: (...values: unknown[]) => SQLExpression;
	export const isInfinite: (...values: unknown[]) => SQLExpression;

	// Logical operations
	export function and(...clauses: unknown[]): SQLExpression;
	export function or(...clauses: unknown[]): SQLExpression;

	// Unary operations
	export function not(a: unknown): SQLExpression;
	export function isNull(a: unknown): SQLExpression;
	export function isNotNull(a: unknown): SQLExpression;

	// Binary operations
	export function eq(a: unknown, b: unknown): SQLExpression;
	export function neq(a: unknown, b: unknown): SQLExpression;
	export function lt(a: unknown, b: unknown): SQLExpression;
	export function gt(a: unknown, b: unknown): SQLExpression;
	export function lte(a: unknown, b: unknown): SQLExpression;
	export function gte(a: unknown, b: unknown): SQLExpression;
	export function isDistinct(a: unknown, b: unknown): SQLExpression;
	export function isNotDistinct(a: unknown, b: unknown): SQLExpression;

	// Range operations
	export function isBetween(
		a: unknown,
		range: [unknown, unknown],
		exclusive?: boolean,
	): SQLExpression;
	export function isNotBetween(
		a: unknown,
		range: [unknown, unknown],
		exclusive?: boolean,
	): SQLExpression;

	// Scale functions
	export function scaleLinear(): object;
	export function scaleLog(options?: { base?: number }): object;
	export function scaleSymlog(options?: { constant?: number }): object;
	export function scaleSqrt(): object;
	export function scalePow(options?: { exponent?: number }): object;
	export function scaleTime(): object;

	export const scales: {
		linear: () => object;
		log: (options?: { base?: number }) => object;
		symlog: (options?: { constant?: number }) => object;
		sqrt: () => object;
		pow: (options?: { exponent?: number }) => object;
		time: () => object;
		utc: () => object;
	};

	export function scaleTransform(options: { type: string }): object;
}