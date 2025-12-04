// App.tsx
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";

// Unit conversion constants
const CONVERSIONS = {
  length: {
    units: ["m", "cm", "km", "mm"],
    factors: { m: 1, cm: 100, km: 0.001, mm: 1000 },
  },
  time: {
    units: ["s", "min", "h", "ms"],
    factors: { s: 1, min: 1 / 60, h: 1 / 3600, ms: 1000 },
  },
  energy: {
    units: ["J", "eV", "kJ", "MJ"],
    factors: { J: 1, eV: 6.242e18, kJ: 0.001, MJ: 1e-6 },
  },
  mass: {
    units: ["kg", "g", "mg", "eV/c²"],
    factors: { kg: 1, g: 1000, mg: 1e6, "eV/c²": 5.609e35 },
  },
  charge: {
    units: ["C", "A·s"],
    factors: { C: 1, "A·s": 1 },
  },
  force: {
    units: ["N", "dyne", "lbf"],
    factors: { N: 1, dyne: 1e5, lbf: 0.224809 },
  },
  pressure: {
    units: ["Pa", "atm", "bar", "mmHg"],
    factors: { Pa: 1, atm: 9.8692e-6, bar: 1e-5, mmHg: 0.00750062 },
  },
  power: {
    units: ["W", "kW", "hp"],
    factors: { W: 1, kW: 0.001, hp: 0.00134102 },
  },
} as const;

type Category = keyof typeof CONVERSIONS;
type Unit = string;

// Scientific notation parser that accepts multiple formats
const parseScientific = (value: string): number => {
  try {
    const num = Number(value);
    if (!isNaN(num)) return num;

    // Handle scientific notation formats
    // 1e5, 1e+5, 1E5, 1E+5
    const standardExp = value.match(/^(-?\d*\.?\d+)[eE]([+-]?\d+)$/);
    if (standardExp) {
      return (
        parseFloat(standardExp[1]) * Math.pow(10, parseInt(standardExp[2]))
      );
    }

    // Handle 1*10^5 format with * multiplication symbol
    const starFormat = value.match(/^(-?\d*\.?\d+)\*10\^([+-]?\d+)$/);
    if (starFormat) {
      return parseFloat(starFormat[1]) * Math.pow(10, parseInt(starFormat[2]));
    }

    // Handle 1×10^5 format with x as multiplication symbol
    const multiplyFormat = value.match(/^(-?\d*\.?\d+)(?:×|x)10\^([+-]?\d+)$/);
    if (multiplyFormat) {
      return (
        parseFloat(multiplyFormat[1]) *
        Math.pow(10, parseInt(multiplyFormat[2]))
      );
    }

    return NaN;
  } catch {
    return NaN;
  }
};

const formatScientific = (value: number): string => {
  if (Math.abs(value) > 1e6 || Math.abs(value) < 1e-6) {
    return value.toExponential(4);
  }
  return value.toFixed(4).replace(/\.?0+$/, "");
};

const UnitConverter: React.FC = () => {
  const [input, setInput] = useState("1");
  const [fromUnit, setFromUnit] = useState<Unit>("m");
  const [toUnit, setToUnit] = useState<Unit>("cm");
  const [category, setCategory] = useState<Category>("length");
  const [error, setError] = useState<string>("");

  //Track the last changed unit
  const prevFromRef = useRef<Unit>(fromUnit);
  const prevToRef = useRef<Unit>(toUnit);
  const lastChangedRef = useRef<"from" | "to" | null>(null);

  const validUnits = useMemo(() => CONVERSIONS[category].units, [category]);
  const factors = useMemo(() => CONVERSIONS[category].factors, [category]);

  // Handle from unit change
  const handleFromUnitChange = useCallback(
    (unit: Unit) => {
      prevFromRef.current = fromUnit;
      lastChangedRef.current = "from";

      // If the new "from" unit matches the current "to" unit
      if (unit === toUnit) {
        // Swap the units by setting "to" to the previous "from" value
        setToUnit(prevFromRef.current);
      }

      setFromUnit(unit);
    },
    [fromUnit, toUnit]
  );

  // Handle to unit change
  const handleToUnitChange = useCallback(
    (unit: Unit) => {
      prevToRef.current = toUnit;
      lastChangedRef.current = "to";

      // If the new "to" unit matches the current "from" unit
      if (unit === fromUnit) {
        // Swap the units by settting "from" to the previous "to" value
        setFromUnit(prevToRef.current);
      }

      setToUnit(unit);
    },
    [fromUnit, toUnit]
  );

  const result = useMemo(() => {
    const num = parseScientific(input);
    if (isNaN(num)) {
      setError("Invalid input format");
      return "Invalid input";
    }
    setError("");

    // Conversion calculation
    const converted =
      num *
      (factors[toUnit as keyof typeof factors] /
        factors[fromUnit as keyof typeof factors]);
    return formatScientific(converted);
  }, [input, fromUnit, toUnit, factors]);

  const handleCategoryChange = useCallback((cat: Category) => {
    setCategory(cat);
    lastChangedRef.current = null;
    const firstUnit = CONVERSIONS[cat].units[0];
    const secondUnit = CONVERSIONS[cat].units[1] || CONVERSIONS[cat].units[0];
    setFromUnit(firstUnit);
    setToUnit(secondUnit);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-indigo-200 p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-indigo-800">
          Scientific Unit Converter
        </h1>

        <div className="mb-6 p-3 bg-blue-50 rounded-md text-sm text-blue-700 border border-blue-200">
          <p className="font-medium mb-1">Input formats accepted:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Standard: 1000</li>
            <li>Scientific: 1e3, 1e+3, 1E3</li>
            <li>With multiplication: 1*10^3, 1×10^3</li>
          </ul>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-indigo-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as Category)}
            className="w-full p-2 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
          >
            {Object.keys(CONVERSIONS).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-indigo-700">
              From
            </label>
            <select
              value={fromUnit}
              onChange={(e) => handleFromUnitChange(e.target.value)}
              className="w-full p-2 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
            >
              {validUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-indigo-700">
              To
            </label>
            <select
              value={toUnit}
              onChange={(e) => handleToUnitChange(e.target.value)}
              className="w-full p-2 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
            >
              {validUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-indigo-700">
            Value
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter value (e.g., 1e3, 1*10^3)"
            className="w-full p-2 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-lg text-white shadow-md">
          <p className="text-sm font-medium text-indigo-100">Result</p>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-mono font-bold">{result}</p>
            <p className="ml-2 text-lg font-mono">{toUnit}</p>
          </div>
        </div>

        <div className="mt-4 text-xs text-center text-gray-500">
          <p>Try different notations: 1000, 1e3, 1*10^3</p>
        </div>
      </div>
    </div>
  );
};

export default UnitConverter;
