"use server";

import { Profile } from "@/types";
import { createClient } from "@supabase/supabase-js";
import { Table } from "../supabase/tables";

import axios from "axios";
import { supabase } from "../supabase/client";
import { getSupabase } from "../supabase-server/serverClient";

