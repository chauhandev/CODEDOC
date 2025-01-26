import React from 'react';

type GeneralResponseProps = {
  responses: string[];
};

const GeneralResponse: React.FC<GeneralResponseProps> = ({ responses }) => {
    console.log(responses);
  return (
    <div className="bg-gray-100 p-4 rounded-md shadow-md w-full max-w-2xl mt-5">
      <h2 className="text-lg font-bold mb-3 text-gray-700">Response</h2>
      <div className="space-y-3">
        <pre  className="whitespace-pre-wrap break-words overflow-auto">{responses}</pre>
      </div>
    </div>
  );
};

export default GeneralResponse;