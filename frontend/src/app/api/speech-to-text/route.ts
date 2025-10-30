import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "en-US";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const mimeType = audioFile.type.split("/")[0];
    if (mimeType !== "audio") {
      return NextResponse.json(
        { error: "The uploaded file is not an audio file" },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    let encoding: string;
    let sampleRateHertz: number;

    if (audioFile.type.startsWith("audio/webm")) {
      encoding = "WEBM_OPUS";
      sampleRateHertz = 48000;
    } else if (
      audioFile.type.startsWith("audio/wav") ||
      audioFile.type.startsWith("audio/x-wav")
    ) {
      encoding = "LINEAR16";
      sampleRateHertz = 16000;
    } else if (
      audioFile.type.startsWith("audio/mpeg") ||
      audioFile.type.startsWith("audio/mp3")
    ) {
      encoding = "MP3";
      sampleRateHertz = 16000;
    } else {
      return NextResponse.json(
        { error: `Unsupported audio type: ${audioFile.type}` },
        { status: 400 }
      );
    }

    const data = {
      audio: {
        content: audioBuffer.toString("base64"),
      },
      config: {
        encoding,
        languageCode: language,
        sampleRateHertz,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: "default",
      },
    };

    const response = await fetch(
      `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const responseData = await response.json();

    if (!responseData.results || responseData.results.length === 0) {
      return NextResponse.json({
        transcript: "",
        message: "No speech detected or could not transcribe.",
      });
    }

    const transcript =
      responseData.results[0]?.alternatives?.[0]?.transcript || "";

    return NextResponse.json({
      transcript,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process speech",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
