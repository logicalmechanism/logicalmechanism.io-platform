import React, { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    duration?: number; // in milliseconds
    onDismiss: () => void; // Function to call on dismiss
}

const Notification: React.FC<NotificationProps> = ({ message, duration = 2718, onDismiss }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
        const timer = setTimeout(() => {
            setShow(false);
        }, duration);

        return () => {
            clearTimeout(timer); // Cleanup the timeout if the component unmounts early
            if (show) {
                onDismiss(); // Ensure cleanup and state reset if the component unmounts prematurely
            }
        }
    }, [message, duration, onDismiss, show]);
    if (!show) return null;
    return (
        <div className="fixed top-4 right-4 bg-red-500 text-white py-2 px-4 rounded shadow-lg transition-opacity duration-500">
            {message}
        </div>
    );
};

export default Notification;
