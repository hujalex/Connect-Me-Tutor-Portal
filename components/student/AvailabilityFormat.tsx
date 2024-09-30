// Single Availability component that takes an array and formats it
const Availability = ({ availability }: { availability: { day: string; time: string }[] }) => (
    <div>
      <ul>
        {availability?.map((entry, index) => (
          <li key={index}>
            <span className='font-semibold'>{entry.day}s:</span> {entry.time}
          </li>
        ))}
      </ul>
    </div>
  );

export default Availability