// lib/actions/migrate.actions.ts
import { Enrollment } from "@/types";
import axios from "axios";

//-------------Indexing based on Data from imported CSV FILE-----------
export const CSV_COLUMNS = {
  "Tutor Name": 1,
  "Student Name": 2,
  "Tutor Email": 3,
  "Tutor Timezone": 4,
  "Student Email": 5,
  "Parent Phone": 6,
  "Parent Email": 7,
  "Student Timezone": 8,
  "Day of the Week": 9,
  "Session Time": 10,
  "Zoom Link": 11,
};

export interface ErrorEntry {
  profile: Profile;
  error: string;
}

export interface ErrorEnrollment {
  enrollment: Enrollment;
  error: string;
}

export function parseNames(name: string) {
  if (!name.trim()) {
    return ["", ""];
  }
  const words_in_name = name.split(" ");
  if (words_in_name.length > 1) {
    return [words_in_name[0], words_in_name[words_in_name.length - 1]];
  }
  return [words_in_name[0], ""];
}

export interface Profile {
  id: string;
  createdAt: string;
  role: "Student" | "Tutor" | "Admin";
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  startDate: string;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  email: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  timeZone: string;
  subjectsOfInterest: string[];
  status: "Active" | "Inactive" | "Deleted";
  tutorIds: string[];
}

interface FetchStudentsResponse {
  success: boolean;
  data?: Profile[];
  error?: string;
}

interface MigrateStudentsResponse {
  success: boolean;
  migratedCount?: number;
  error?: string;
}

// Helper function to parse WordPress availability format to Profile format
function parseAvailability(wpAvailability: string[]): Profile["availability"] {
  return wpAvailability.map((slot) => {
    // Expected format from WordPress: "Monday 3:00 PM-6:00 PM"
    const [day, time] = slot.split(" ");
    const [startTime, endTime] = time.split("-");
    return {
      day,
      startTime,
      endTime,
    };
  });
}

// Helper function to generate a unique ID
function generateId(): string {
  return "wp_" + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function fetchWordPressStudents(): Promise<FetchStudentsResponse> {
  try {
    // Check if environment variables are set
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const wpUsername = process.env.NEXT_PUBLIC_WORDPRESS_USERNAME;
    const wpPassword = process.env.NEXT_PUBLIC_WORDPRESS_PASSWORD;

    if (!wpUrl || !wpUsername || !wpPassword) {
      throw new Error(
        "WordPress credentials not configured. Please check your environment variables."
      );
    }

    // First authenticate
    const authResponse = await axios.post(
      `${wpUrl}/wp-json/jwt-auth/v1/token`,
      {
        username: wpUsername,
        password: wpPassword,
      }
    );

    if (!authResponse.data.token) {
      throw new Error("Failed to authenticate with WordPress");
    }

    // Fetch students with auth token
    const studentsResponse = await axios.get(
      `${wpUrl}/wp-json/wp/v2/students`,
      {
        headers: {
          Authorization: `Bearer ${authResponse.data.token}`,
        },
        params: {
          per_page: 100,
          status: ["publish", "pending", "draft"],
        },
      }
    );

    // Transform WordPress data to Profile format
    const students: Profile[] = studentsResponse.data.map((wpStudent: any) => {
      const currentDate = new Date().toISOString().split("T")[0];

      return {
        id: generateId(),
        createdAt: currentDate,
        role: "Student",
        userId: generateId(), // You might want to handle this differently based on your user management system
        firstName: wpStudent.acf?.first_name || "",
        lastName: wpStudent.acf?.last_name || "",
        dateOfBirth: wpStudent.acf?.date_of_birth || currentDate,
        startDate: currentDate,
        availability: parseAvailability(wpStudent.acf?.availability || []),
        email: wpStudent.acf?.email || "",
        parentName: wpStudent.acf?.parent_name,
        parentPhone: wpStudent.acf?.parent_phone,
        parentEmail: wpStudent.acf?.parent_email,
        timeZone: wpStudent.acf?.timezone || "America/New_York",
        subjectsOfInterest: wpStudent.acf?.subjects_of_interest || [],
        status: "Active",
        tutorIds: [],
      };
    });

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    console.error("Error fetching WordPress students:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch students",
    };
  }
}

export async function analyzeAndTransformStudents(): Promise<FetchStudentsResponse> {
  try {
    // First fetch the raw WordPress data
    const wpResponse = await fetchWordPressStudents();

    if (!wpResponse.success || !wpResponse.data) {
      throw new Error(wpResponse.error || "Failed to fetch WordPress data");
    }

    // If OpenAI analysis is needed, process each student
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      const analyzedStudents = await Promise.all(
        wpResponse.data.map(async (student) => {
          try {
            // Send to OpenAI for analysis
            const openAiResponse = await axios.post(
              "https://api.openai.com/v1/chat/completions",
              {
                model: "gpt-4",
                messages: [
                  {
                    role: "system",
                    content: `Analyze and enhance student profile data. Focus on:
                      - Standardizing subject names
                      - Formatting availability slots
                      - Validating data formats
                      Return only valid JSON matching the Profile interface.`,
                  },
                  {
                    role: "user",
                    content: JSON.stringify(student),
                  },
                ],
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
                  "Content-Type": "application/json",
                },
              }
            );

            const enhancedData = JSON.parse(
              openAiResponse.data.choices[0].message.content
            );
            return { ...student, ...enhancedData };
          } catch (error) {
            console.error(
              "OpenAI analysis failed for student:",
              student,
              error
            );
            return student; // Return original data if analysis fails
          }
        })
      );

      return {
        success: true,
        data: analyzedStudents,
      };
    }

    // If no OpenAI key, return the original data
    return wpResponse;
  } catch (error) {
    console.error("Error in analyzeAndTransformStudents:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to analyze students",
    };
  }
}

export async function migrateSelectedStudents(
  students: Profile[]
): Promise<MigrateStudentsResponse> {
  try {
    // Here you would implement the actual migration logic to your system
    // For example, saving to your database using your preferred method
    const migratedStudents = await Promise.all(
      students.map(async (student) => {
        // Example: Make an API call to your backend to create the profile
        const response = await axios.post("/api/profiles", student);
        return response.data;
      })
    );

    return {
      success: true,
      migratedCount: migratedStudents.length,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to migrate students",
    };
  }
}
