export const Select = ({ children }) => <div>{children}</div>;
export const SelectTrigger = ({ children }) => <button className="border p-2 w-full text-left">{children}</button>;
export const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;
export const SelectContent = ({ children }) => <div>{children}</div>;
export const SelectItem = ({ children, value }) => <div value={value}>{children}</div>;