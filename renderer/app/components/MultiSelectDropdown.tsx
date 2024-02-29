import { useState } from 'react';

export default function MultiSelectDropdown({
    title,
    options,
    onChange,
}: {
    title: string;
    options: string[];
    onChange: (selectedOptions: string[]) => void;
}) {
    const [selectedOptions, setSelectedOptions] = useState([]);

    const handleChange = (event) => {
        const isChecked = event.target.checked;
        const option = event.target.value;

        const selectedOptionSet = new Set<string>(selectedOptions);

        if (isChecked) {
            selectedOptionSet.add(option);
        } else {
            selectedOptionSet.delete(option);
        }

        const newSelectedOptions = [...selectedOptionSet];

        setSelectedOptions(newSelectedOptions);
        onChange(newSelectedOptions);
    };

    return (
        <label className="relative">
            <input type="checkbox" className="hidden peer" />

            <div className="cursor-pointer after:content-['▼'] after:ml-1 after:inline-flex after:items-center after:float-right peer-checked:after:-rotate-180 after:transition-transform p-1 bg-base-300 text-primary text-center">
                {title}
            </div>
            <div className="absolute bg-base-100 border p-2 transition-opacity opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto w-full">
                <ul>
                    {options?.map((option, i) => {
                        return (
                            <li key={option}>
                                <label className="flex whitespace-nowrap cursor-pointer px-2 py-1 transition-colors hover:bg-base-300 [&:has(input:checked)]:bg-base-200">
                                    <input
                                        type="checkbox"
                                        value={option}
                                        className="cursor-pointer"
                                        onChange={handleChange}
                                    />
                                    <span className="ml-1">{option}</span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </label>
    );
}
