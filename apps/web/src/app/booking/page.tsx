"use client";
import React, { useState } from "react";
import { book_appointment } from "./booking";

function isSunday(date: Date) {
  return date.getDay() === 0;
}

const serviceOptions = {
  woman: ["Women's Haircut", "Shampoo Blow Dry", "Full Hair Color", "Highlights"],
  man: ["Men's Haircut", "Men's Beard"],
  child: ["Children's Haircut"],
};

const serviceDurations: { [key: string]: number } = {
  "Women's Haircut": 45,
  "Shampoo Blow Dry": 30,
  "Full Hair Color": 120,
  "Highlights": 90,
  "Men's Haircut": 30,
  "Men's Beard": 20,
  "Children's Haircut": 20,
};

const BookAppointment: React.FC = () => {
  const [gender_age, setGender_Age] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string>("");

  const filteredServices =
    gender_age === "woman"
      ? serviceOptions.woman
      : gender_age === "man"
      ? serviceOptions.man
      : gender_age === "child"
      ? serviceOptions.child
      : [];

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);

  const handleGender_AgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGender_Age(e.target.value);
    setSelectedServices([]); 
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateValue = e.target.value;
    const date = new Date(selectedDateValue);

    if (isSunday(date)) {
      setSelectedDate("");
      setDateError("Appointments cannot be booked on Sundays.");
    } else {
      setSelectedDate(selectedDateValue);
      setDateError("");
      if (selectedServices.length > 0) {
        await fetchAvailableTimes(selectedDateValue, selectedServices);
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(e.target.value);
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedServices(selected);
    if (selectedDate) {
      fetchAvailableTimes(selectedDate, selected);
    }
  };

  const fetchAvailableTimes = async (date: string, services: string[]) => {
    try {
      const serviceParam = services.join(","); 
      const response = await fetch(
        `http://127.0.0.1:8000/get-free-time?date=${date}&services=${serviceParam}`
      );
      if (!response.ok) {
        throw new Error(`Error fetching available times: ${response.statusText}`);
      }
      const freeTimes = await response.json();

      if (Array.isArray(freeTimes)) {
        setAvailableTimes(freeTimes); 
      } else {
        setAvailableTimes([]); 
      }
    } catch (error) {
      console.error("Error fetching available times:", error);
      setAvailableTimes([]);
    }
  };

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const [timeString, period] = selectedTime.split(" ");
      const [hours, minutes] = timeString.split(":").map(Number);

      let adjustedHours = period === "PM" && hours !== 12 ? hours + 12 : hours;
      if (period === "AM" && hours === 12) adjustedHours = 0;

      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(adjustedHours, minutes);

      const totalDuration = selectedServices.reduce(
        (sum, service) => sum + serviceDurations[service],
        0
      );
      const endTime = new Date(dateWithTime);
      endTime.setMinutes(endTime.getMinutes() + totalDuration);

      const formData = {
        email,
        date: new Date(selectedDate),
        time: dateWithTime,
        end_time: endTime,
        services: selectedServices,
      };

      const response = await book_appointment(formData);

      if (response?.error) {
        setErrorMessage(response.error);
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Error submitting the form. Please try again.");
      console.error("Form submission error:", error);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-gray-100 min-h-screen flex flex-col items-center justify-center relative">
      <div className="absolute w-[24rem] h-[24rem] bg-gray-700 rounded-full left-[-12rem] top-1/2 transform -translate-y-1/2 overflow-hidden hidden lg:block"></div>
      <div className="absolute w-[24rem] h-[24rem] bg-yellow-400 rounded-full left-[8rem] top-1/2 transform -translate-y-1/2 overflow-hidden hidden lg:block"></div>
      <h1 className="text-4xl font-bold mb-6 z-10">Book an Appointment</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative z-10">
        <div className="mb-4">
          <label htmlFor="gender_age" className="block text-lg font-medium mb-2">
            Gender and Age
          </label>
          <select
            id="gender_age"
            value={gender_age}
            onChange={handleGender_AgeChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="" disabled>
              Select Gender/Age
            </option>
            <option value="woman">Woman</option>
            <option value="man">Man</option>
            <option value="child">Child</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-lg font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="block text-lg font-medium mb-2">
            Select Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className={`w-full p-2 border ${dateError ? "border-red-500" : "border-gray-300"} rounded-lg`}
            min={today.toISOString().split("T")[0]}
            max={maxDate.toISOString().split("T")[0]}
            required
          />
          {dateError && <p className="text-red-500 mt-2">{dateError}</p>}
        </div>

        <div className="mb-6">
          <label htmlFor="service" className="block text-lg font-medium mb-2">
            Type of Services
          </label>
          <select
            id="service"
            multiple 
            size={filteredServices.length}
            value={selectedServices}
            onChange={handleServiceChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            {filteredServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="time" className="block text-lg font-medium mb-2">
            Select Time
          </label>
          <select
            id="time"
            value={selectedTime}
            onChange={handleTimeChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="" disabled>
              Select Time
            </option>
            {availableTimes.map((time, index) => (
              <option key={index} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-yellow-400 text-white px-4 py-2 rounded-lg w-full mt-4"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Booking..." : "Book Appointment"}
        </button>
        {status === "error" && <p className="text-red-500 mt-4">{errorMessage}</p>}
        {status === "success" && (
          <p className="text-green-500 mt-4">Appointment successfully booked!</p>
        )}
      </form>
    </div>
  );
};

export default BookAppointment;
