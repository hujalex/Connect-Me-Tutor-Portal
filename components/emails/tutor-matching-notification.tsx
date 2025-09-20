import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Section,
} from "@react-email/components";

export interface TutorMatchingNotificationEmailProps {
  studentName: string;
  parentName: string;
  tutorName: string;
  tutorEmail: string;
  sessionDay: string;
  sessionStartTime: string;
  sessionEndTime: string;
  isPreview?: boolean;
}

export default function TutorMatchingNotificationEmail({
  studentName = "Alex",
  parentName = "parent",
  tutorName = "tutor",
  tutorEmail = "ahu@connectmego.org",
  sessionDay = "Monday",
  sessionStartTime = "3 pm",
  sessionEndTime = "4 pm",
  isPreview = false,
}: TutorMatchingNotificationEmailProps) {
  // Helper function to get pronouns based on gender
  const getPronouns = (gender: string) => {
    switch (gender) {
      case "male":
        return { subject: "he", object: "him", possessive: "his" };
      case "female":
        return { subject: "she", object: "her", possessive: "her" };
      default:
        return { subject: "they", object: "them", possessive: "their" };
    }
  };

  // const pronouns = getPronouns(studentGender);

  const EmailContent = () => (
    <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <Section
        style={{
          backgroundColor: "#2563eb",
          color: "#ffffff",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <Text style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>
          Connect Me Online Tutoring
        </Text>
      </Section>

      {/* Main Content */}
      <Section style={{ padding: "24px" }}>
        {/* Greeting */}
        <Text
          style={{
            color: "#374151",
            fontSize: "16px",
            lineHeight: "1.6",
            margin: "0 0 24px 0",
          }}
        >
          Dear {parentName},
        </Text>

        {/* Main Message */}
        <Section
          style={{
            backgroundColor: "#f0fdf4",
            borderLeft: "4px solid #22c55e",
            padding: "16px",
            borderRadius: "0 8px 8px 0",
            margin: "0 0 24px 0",
          }}
        >
          <Text
            style={{
              color: "#374151",
              fontSize: "16px",
              lineHeight: "1.6",
              margin: "0",
            }}
          >
            We are excited to let you know that {studentName} has been matched
            with a tutor! Your sessions will occur on <strong>{sessionDay}</strong> from <strong>{sessionStartTime}</strong> to <strong>{sessionEndTime}</strong>. If unable to attend these sessions, please reach out to {tutorEmail} to arrange a differeng time
          </Text>
        </Section>

        {/* Portal Instructions */}
        <Section
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "16px",
            margin: "0 0 24px 0",
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: "#1e40af",
              fontSize: "16px",
              margin: "0 0 8px 0",
            }}
          >
            Next Steps
          </Text>
          <Text
            style={{
              color: "#374151",
              fontSize: "16px",
              lineHeight: "1.6",
              margin: "0 0 12px 0",
            }}
          >
            In the meantime, we recommend that you create an account on the
            Connect Me Tutor Portal so you can easily access the zoom link and
            communicate with the tutor through the website.
          </Text>
          <Text
            style={{
              color: "#374151",
              fontSize: "16px",
              lineHeight: "1.6",
              margin: "0",
            }}
          >
            Please check your inbox and spam for an email from Connect Me to
            sign up for our tutor portal.
          </Text>
        </Section>

        {/* Support Information */}
        <Section
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
            margin: "0 0 24px 0",
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: "#374151",
              fontSize: "16px",
              margin: "0 0 8px 0",
            }}
          >
            Need Help?
          </Text>
          <Text
            style={{
              color: "#374151",
              fontSize: "16px",
              lineHeight: "1.6",
              margin: "0",
            }}
          >
            If you experience any issues, please reach out to{" "}
            <Link
              href="mailto:ykowalczyk@connectmego.org"
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              ykowalczyk@connectmego.org
            </Link>{" "}
            for assistance.
          </Text>
        </Section>

        {/* Closing */}
        <Section style={{ paddingTop: "16px" }}>
          <Text
            style={{
              color: "#374151",
              fontSize: "16px",
              lineHeight: "1.6",
              margin: "0",
            }}
          >
            Best,
          </Text>
          <Text
            style={{
              color: "#374151",
              fontSize: "16px",
              lineHeight: "1.6",
              fontWeight: "bold",
              margin: "0",
            }}
          >
            Connect Me Online Tutoring Team
          </Text>
        </Section>
      </Section>

      {/* Footer */}
      <Section
        style={{
          backgroundColor: "#f3f4f6",
          padding: "16px",
          textAlign: "center",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Text style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>
          Connect Me Online Tutoring | Connecting Students with Success
        </Text>
      </Section>
    </Container>
  );

  if (isPreview) {
    return (
      <div
        style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#ffffff" }}
      >
        <EmailContent />
      </div>
    );
  }

  return (
    <Html>
      <Head />
      <Body
        style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#ffffff" }}
      >
        <EmailContent />
      </Body>
    </Html>
  );
}
